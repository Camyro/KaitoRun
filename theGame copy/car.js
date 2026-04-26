// ========================================
// SISTEMA DE CARROS - ARQUIVO INDEPENDENTE
// car-system-standalone.js
// ========================================

(function() {
  'use strict';

  // Variáveis do sistema de carros
  let allCars = []
  let carSpawnTimer = null
  let isSystemActive = false
  let gameSpeed = 1
  let isGamePaused = false

  // Esperar o DOM carregar
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚗 Sistema de Carros Carregado!')

    // Pegar elementos necessários
    const grid = document.querySelector('.grid')

    if (!grid) {
      console.error('⚠️ Elemento .grid não encontrado! Certifique-se de que existe no HTML.')
      return
    }

    // Detectar quando o jogo inicia (quando aparecer o primeiro obstáculo)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0 && !isSystemActive) {
          // Verificar se algum obstáculo foi adicionado
          mutation.addedNodes.forEach(node => {
            if (node.classList && (
                node.classList.contains('arbustro') || 
                node.classList.contains('lamaC') ||
                node.classList.contains('pergunta1')
            )) {
              console.log('🎮 Jogo iniciado! Começando a spawnar carros...')
              isSystemActive = true
              startCarSystem()
            }
          })
        }
      })
    })

    observer.observe(grid, { childList: true })

    // Detectar quando uma pergunta aparece (pausa)
    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.id === 'questionOverlay') {
              console.log('⏸️ Pergunta detectada - Pausando carros')
              pauseCars()
            }
          })
        }
        if (mutation.removedNodes.length > 0) {
          mutation.removedNodes.forEach(node => {
            if (node.id === 'questionOverlay') {
              console.log('▶️ Pergunta removida - Retomando carros')
              resumeCars()
            }
          })
        }
      })
    })

    bodyObserver.observe(document.body, { childList: true })

    // Monitorar mudanças de velocidade do jogo (opcional)
    setInterval(() => {
      // Aumentar velocidade gradualmente
      if (isSystemActive && !isGamePaused) {
        gameSpeed = 1 + (Date.now() % 100000) / 100000 // Aumenta gradualmente
      }
    }, 5000)
  })

  // Iniciar sistema de carros
  function startCarSystem() {
    if (!isSystemActive) return
    scheduleNextCar()
  }

  // Pausar carros
  function pauseCars() {
    isGamePaused = true

    allCars.forEach(car => {
      if (car.moveInterval) {
        clearInterval(car.moveInterval)
        car.moveInterval = null
      }
      car.paused = true
      car.savedPosition = parseInt(car.element.style.left) || 0
    })

    if (carSpawnTimer) {
      clearTimeout(carSpawnTimer)
      carSpawnTimer = null
    }
  }

  // Retomar carros
  function resumeCars() {
    isGamePaused = false

    allCars.forEach(car => {
      if (car.paused && car.element.parentNode) {
        car.paused = false
        continueCarMovement(car)
      }
    })

    scheduleNextCar()
  }

  // Criar um carro
  function createCar(type) {
    if (isGamePaused) return

    const grid = document.querySelector('.grid')
    if (!grid) return

    const car = document.createElement('div')
    car.className = 'game-car'
    car.style.position = 'absolute'
    car.style.width = '120px'
    car.style.height = '60px'
    car.style.backgroundSize = 'contain'
    car.style.backgroundRepeat = 'no-repeat'
    car.style.backgroundPosition = 'center'
    car.style.pointerEvents = 'none'
    car.style.transition = 'none'

    if (type === 'ground') {
      // Carro que passa na pista (mesma altura dos obstáculos)
      car.style.bottom = '20px'
      car.style.zIndex = '14' // Atrás do personagem, na frente da estrada

      // Usar emojis como placeholder
      car.innerHTML = '🚗'
      car.style.fontSize = '50px'
      car.style.textAlign = 'center'
      car.style.lineHeight = '46px'

      // Se você tiver as imagens, descomente abaixo:
      /*
      const carVariant = Math.floor(Math.random() * 3) + 1
      if (carVariant === 1) {
        car.style.backgroundImage = "url('../midia/carro/carro1.png')"
      } else if (carVariant === 2) {
        car.style.backgroundImage = "url('../midia/carro/carro2.png')"
      } else {
        car.style.backgroundImage = "url('../midia/carro/carro3.png')"
      }
      car.innerHTML = '' // Remover emoji
      */
    } else {
      // Carros que passam acima (efeito de outras pistas)
      car.style.bottom = '78px'
      car.style.zIndex = '14'
      car.style.transform = 'scaleX(-1)'
      car.style.opacity = '0.7'

      // Usar emojis como placeholder
      car.innerHTML = '🚙'
      car.style.fontSize = '50px'
      car.style.textAlign = 'center'
      car.style.lineHeight = '60px'

      // Se você tiver as imagens, descomente abaixo:
      /*
      const carVariant = Math.floor(Math.random() * 3) + 1
      if (carVariant === 1) {
        car.style.backgroundImage = "url('../midia/carro/carro4.png')"
      } else if (carVariant === 2) {
        car.style.backgroundImage = "url('../midia/carro/carro5.png')"
      } else {
        car.style.backgroundImage = "url('../midia/carro/carro6.png')"
      }
      car.innerHTML = '' // Remover emoji
      */
    }

    grid.appendChild(car)
    moveCar(car, type)
  }

  // Movimentar o carro
  function moveCar(car, type) {
    let carPosition = type === 'ground' ? window.innerWidth + 500 : -200
    car.style.left = carPosition + 'px'

    const carData = {
      element: car,
      type: type,
      moveInterval: null,
      paused: false,
      savedPosition: carPosition
    }

    allCars.push(carData)

    const speed = type === 'ground' ? 15 : 12
    const direction = type === 'ground' ? -1 : 1

    carData.moveInterval = setInterval(function() {
      if (isGamePaused) {
        clearInterval(carData.moveInterval)
        return
      }

      carPosition += (speed * direction * gameSpeed)
      car.style.left = carPosition + 'px'

      // Remover carro quando sair da tela
      if ((type === 'ground' && carPosition < -200) || 
          (type === 'upper' && carPosition > window.innerWidth + 200)) {
        clearInterval(carData.moveInterval)
        if (car.parentNode) {
          car.parentNode.removeChild(car)
        }
        allCars = allCars.filter(c => c.element !== car)
      }
    }, 20)
  }

  // Continuar movimento do carro
  function continueCarMovement(carData) {
    const car = carData.element
    const type = carData.type
    let carPosition = carData.savedPosition

    const speed = type === 'ground' ? 15 : 12
    const direction = type === 'ground' ? -1 : 1

    carData.moveInterval = setInterval(function() {
      if (isGamePaused) {
        clearInterval(carData.moveInterval)
        return
      }

      carPosition += (speed * direction * gameSpeed)
      car.style.left = carPosition + 'px'
      carData.savedPosition = carPosition

      // Remover carro quando sair da tela
      if ((type === 'ground' && carPosition < -200) || 
          (type === 'upper' && carPosition > window.innerWidth + 200)) {
        clearInterval(carData.moveInterval)
        if (car.parentNode) {
          car.parentNode.removeChild(car)
        }
        allCars = allCars.filter(c => c.element !== car)
      }
    }, 20)
  }

  // Agendar próximo carro
  function scheduleNextCar() {
    if (!isSystemActive || isGamePaused) return

    const randomTime = Math.random() * 3000 + 2000 // Entre 2 e 5 segundos

    carSpawnTimer = setTimeout(() => {
      // 60% de chance de ser carro no chão, 40% no alto
      const carType = Math.random() < 0.6 ? 'ground' : 'upper'
      createCar(carType)

      scheduleNextCar()
    }, randomTime)
  }

  // Expor funções globalmente (opcional)
  window.CarSystem = {
    start: startCarSystem,
    pause: pauseCars,
    resume: resumeCars
  }

})()