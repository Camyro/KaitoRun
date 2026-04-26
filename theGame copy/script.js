document.addEventListener('DOMContentLoaded', () => {
  const studentContainer = document.querySelector('.student-container')
  const skins = document.querySelectorAll('.student-skin')
  const grid = document.querySelector('.grid')
  const body = document.querySelector('body')
  const theEnd = document.getElementById('theEnd')
  const text = document.getElementById('text')
  const perfil = document.getElementById('perfil')
  const songFlash = document.getElementById('songFlash')
  const songYoru = document.getElementById('songYoru')
  const music = document.getElementById('music')
  const songJump = document.getElementById('songJump')
  let isJumping = false
  let gravity = 0.9
  let isGameOver = false
  let start = false
  let spacetimeGaps = 0
  let timeAbility = 0
  let typeAbility = 0
  let gameSpeed = 1
  let gameTime = 0
  let gameTimer = null
  const maxGameTime = 240
  let abilityTimer = null
  let lives = 3
  let usedQuestions = []
  let isQuestionActive = false
  let questionTimerInterval = null
  let allObstacles = []
  let triangulo = false
  let trianguloActive = false

  const questions = [
    {
      question: "Qual é a capital do Brasil?",
      options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
      correct: 2,
      timeLimit: 10
    },
    {
      question: "Quanto é 5 x 8?",
      options: ["35", "40", "45", "48"],
      correct: 1,
      timeLimit: 8
    },
    {
      question: "Qual é o maior planeta do Sistema Solar?",
      options: ["Terra", "Marte", "Júpiter", "Saturno"],
      correct: 2,
      timeLimit: 12
    },
    {
      question: "Em que ano o Brasil foi descoberto?",
      options: ["1492", "1500", "1822", "1889"],
      correct: 1,
      timeLimit: 10
    },
    {
      question: "Qual é a fórmula da água?",
      options: ["H2O", "CO2", "O2", "NaCl"],
      correct: 0,
      timeLimit: 8
    },
    {
      question: "Quantos continentes existem no mundo?",
      options: ["5", "6", "7", "8"],
      correct: 2,
      timeLimit: 10
    },
    {
      question: "Quem pintou a Mona Lisa?",
      options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
      correct: 2,
      timeLimit: 15
    },
    {
      question: "Qual é o menor estado do Brasil?",
      options: ["Sergipe", "Alagoas", "Rio de Janeiro", "Espírito Santo"],
      correct: 0,
      timeLimit: 12
    },
    {
      question: "Quantos dias tem um ano bissexto?",
      options: ["365", "366", "364", "367"],
      correct: 1,
      timeLimit: 8
    },
    {
      question: "Qual é a velocidade da luz?",
      options: ["300.000 km/s", "150.000 km/s", "500.000 km/s", "250.000 km/s"],
      correct: 0,
      timeLimit: 12
    }
  ]

  function pauseGame() {
    // Remover todos os obstáculos que ainda não apareceram na tela
    allObstacles.forEach(obs => {
      if (obs.moveInterval) {
        clearInterval(obs.moveInterval)
      }
      // Remover obstáculos que estão fora da tela (ainda não apareceram)
      const obstaclePosition = parseInt(obs.element.style.left)
      if (obstaclePosition > window.innerWidth && obs.element.parentNode) {
        grid.removeChild(obs.element)
      } else if (!obs.paused) {
        // Pausar apenas os que já estão visíveis
        obs.paused = true
        obs.savedPosition = obstaclePosition
      }
    })

    // Limpar obstáculos removidos do array
    allObstacles = allObstacles.filter(obs => obs.element.parentNode !== null)

    // Pausar timers
    if (gameTimer) {
      clearInterval(gameTimer)
      gameTimer = null
    }
    if (abilityTimer) {
      clearInterval(abilityTimer)
      abilityTimer = null
    }
  }

  function resumeGame() {
    // Retomar movimento dos obstáculos
    allObstacles.forEach(obs => {
      if (obs.paused && obs.element.parentNode) {
        obs.paused = false
        continueObstacleMovement(obs)
      }
    })

    // Retomar timers
    startSpeedIncrease()

    // Retomar ability timer se estava ativo
    if (timeAbility > 0 && !abilityTimer) {
      // Recalcular tempo restante e reiniciar
      startAbilityTimer(typeAbility === 2 ? 50 : 20)
    }
  }

  function continueObstacleMovement(obs) {
    const obstacle = obs.element
    const typer = obs.type
    let obstaclePosition = parseInt(obstacle.style.left)

    obs.moveInterval = setInterval(function() {
      if (isGameOver) {
        clearInterval(obs.moveInterval)
        return
      }

      obstaclePosition -= (timeAbility > 0 && typeAbility == 2 ? 10 * 0.2 : 10) * gameSpeed
      obstacle.style.left = obstaclePosition + 'px'

      // Colisão - PROTEÇÃO: não detecta colisão durante perguntas
      if (obstaclePosition > 0 && obstaclePosition < 64 && studentPosition < 27 && !obstacle.processado && !isQuestionActive) {
        obstacle.processado = true

        if (typer == 1) {
          if (obstacle.parentNode) {
            grid.removeChild(obstacle)
          }

          obstacle.vidaPerdida = true
          pauseGame()
          showQuestion()
        } else {
          if (spacetimeGaps > 0 && !obstacle.atravessado) {
            obstacle.atravessado = true
            spacetimeGaps -= 1

            const percentage = (spacetimeGaps / maxSpacetimeGaps) * 100
            updateAbilityBar(percentage, true)

            if (spacetimeGaps == 2) {
              text.innerHTML = "Você pode atravessar mais " + spacetimeGaps + " obstáculos!"
            } else if (spacetimeGaps == 1) {
              text.innerHTML = "Você pode atravessar mais " + spacetimeGaps + " obstáculo!"
            } else if (spacetimeGaps == 0) {
              updateAbilityBar(0, true)
              maxSpacetimeGaps = 0
              changeSkin('normal')
              text.innerHTML = textPadrao()
              perfil.src = "../midia/personagem/perfil/kaito.png"
            }
          } else if (!obstacle.atravessado && spacetimeGaps == 0) {
            endGame('Você tropeçou e não conseguiu chegar a tempo!')
          }
        }
      }

      // Perda de vida por passar - PROTEÇÃO: não perde vida durante perguntas
      if (obstaclePosition < -60 && !obstacle.vidaPerdida && !isQuestionActive) {
        clearInterval(obs.moveInterval)
        if (obstacle.parentNode) {
          grid.removeChild(obstacle)
        }

        if (typer == 1) {
          obstacle.vidaPerdida = true

          if (lives == 1) {
            endGame('Você tropeçou e não conseguiu chegar a tempo!')
          } else {
            if (lives == 3) {
              document.querySelectorAll('.coracao')[2].style.display = 'none'
            } else if (lives == 2) {
              document.querySelectorAll('.coracao')[1].style.display = 'none'
            }
            lives -= 1
            text.innerHTML = "Menos uma vida! Você tem mais " + lives +" vidas!"
          }
        }
      }
    }, 20)
  }

  function updateAbilityBar(percentage, isYoru = false) {
    let abilityBar = document.getElementById('abilityBar')
    let abilityBarContainer = document.getElementById('abilityBarContainer')

    if (!abilityBarContainer) {
      abilityBarContainer = document.createElement('div')
      abilityBarContainer.id = 'abilityBarContainer'
      abilityBarContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 8px;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: 2000;
        overflow: hidden;
      `

      abilityBar = document.createElement('div')
      abilityBar.id = 'abilityBar'
      abilityBar.style.cssText = `
        height: 100%;
        width: 0%;
        transition: width 0.1s linear;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      `

      abilityBarContainer.appendChild(abilityBar)
      document.body.appendChild(abilityBarContainer)
    }

    if (percentage > 0) {
      abilityBarContainer.style.display = 'block'
      abilityBar.style.width = percentage + '%'

      if (isYoru || spacetimeGaps > 0) {
        abilityBar.style.backgroundColor = 'rgba(0, 0, 225, 1)'
      } else if (typeAbility == 1) {
        abilityBar.style.backgroundColor = 'rgba(225, 150, 0, 1)'
      } else if (typeAbility == 2) {
        abilityBar.style.backgroundColor = 'rgba(225, 0, 0, 1)'
      }
    } else {
      songFlash.pause();
      songYoru.pause()
      music.play()
      abilityBar.style.transition = 'width 0.5s ease-out, opacity 0.5s ease-out'
      abilityBar.style.opacity = '0'
      setTimeout(() => {
        abilityBarContainer.style.display = 'none'
        abilityBar.style.transition = 'width 0.1s linear'
        abilityBar.style.opacity = '1'
        triangulo = false
      }, 500)
    }
  }

  function showQuestion() {
    if (isQuestionActive) return

    isQuestionActive = true

    // Selecionar pergunta aleatória não usada
    let availableQuestions = questions.filter((_, index) => !usedQuestions.includes(index))

    // Se todas as perguntas foram usadas, resetar
    if (availableQuestions.length === 0) {
      usedQuestions = []
      availableQuestions = questions
    }

    setTimeout(trianguloActive = true, 20);

    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const questionData = availableQuestions[randomIndex]
    const originalIndex = questions.indexOf(questionData)
    usedQuestions.push(originalIndex)

    // Criar overlay
    const overlay = document.createElement('div')
    overlay.id = 'questionOverlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `

    // Criar container da pergunta
    const questionContainer = document.createElement('div')
    questionContainer.style.cssText = `
      background-color: white;
      border: 4px solid #333;
      border-radius: 10px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      position: relative;
    `

    // Timer display
    const timerDisplay = document.createElement('div')
    timerDisplay.id = 'questionTimer'
    timerDisplay.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      font-family: "Micro 5", sans-serif;
      font-size: 32px;
      font-weight: bold;
      color: #ff0000;
      background-color: rgba(255, 255, 0, 0.3);
      padding: 5px 15px;
      border-radius: 5px;
      border: 2px solid #ff0000;
    `
    timerDisplay.textContent = questionData.timeLimit
    questionContainer.appendChild(timerDisplay)

    // Título da pergunta
    const questionTitle = document.createElement('h2')
    questionTitle.textContent = questionData.question
    questionTitle.style.cssText = `
      font-family: "Micro 5", sans-serif;
      font-size: 24px;
      color: #333;
      margin-bottom: 20px;
      margin-top: 30px;
      text-align: center;
    `

    questionContainer.appendChild(questionTitle)

    // Criar botões de alternativas
    const buttons = []
    questionData.options.forEach((option, index) => {
      const button = document.createElement('button')
      button.textContent = option
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 15px;
        margin: 10px 0;
        font-family: "Micro 5", sans-serif;
        font-size: 18px;
        background-color: rgb(0, 0, 225);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
      `

      button.onmouseover = () => {
        button.style.backgroundColor = 'rgb(0, 0, 225)'
        button.style.transform = 'scale(1.05)'
      }

      button.onmouseout = () => {
        button.style.backgroundColor = 'rgb(0, 0, 225)'
        button.style.transform = 'scale(1)'
      }

      button.onclick = () => {
        if (questionTimerInterval) {
          clearInterval(questionTimerInterval)
        }
        handleAnswer(index, questionData.correct, overlay)
      }

      buttons.push(button)
      questionContainer.appendChild(button)
    })

    overlay.appendChild(questionContainer)
    document.body.appendChild(overlay)

    // Iniciar contagem regressiva
    let timeRemaining = questionData.timeLimit
    questionTimerInterval = setInterval(() => {
      timeRemaining--
      timerDisplay.textContent = timeRemaining

      // Mudar cor conforme o tempo acaba
      if (timeRemaining <= 3) {
        timerDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'
        timerDisplay.style.animation = 'pulse 0.5s infinite'
      } else if (timeRemaining <= 5) {
        timerDisplay.style.backgroundColor = 'rgba(255, 165, 0, 0.4)'
      }

      if (timeRemaining <= 0) {
        clearInterval(questionTimerInterval)
        // Tempo esgotado - perde vida
        handleTimeOut(overlay)
      }
    }, 1000)
  }

  function handleTimeOut(overlay) {
    isQuestionActive = false

    if (lives > 1) {
      if (lives == 3) {
        document.querySelectorAll('.coracao')[2].style.display = 'none'
        overlay.remove()
        resumeGame()
      } else if (lives == 2) {
        document.querySelectorAll('.coracao')[1].style.display = 'none'
      }
      lives -= 1
      text.innerHTML = "Tempo esgotado! Menos uma vida! Você tem mais " + lives + " vidas!"
      overlay.remove()
      resumeGame()
    } else {
      // Game over
      document.querySelectorAll('.coracao')[0].style.display = 'none'
      lives = 0
      overlay.remove()
      endGame('Você tropeçou e não conseguiu chegar a tempo!')
    }
  }

  function handleAnswer(selectedIndex, correctIndex, overlay) {
    isQuestionActive = false

    if (selectedIndex === correctIndex) {
      // Resposta correta - dar habilidade aleatória
      const abilityType = Math.floor(Math.random() * 3) + 1


      if (abilityType === 1) {
        // Brecha no espaço-tempo (Yoru)
        spacetimeGaps = Math.floor(Math.pow(Math.random(), 3) * 7 + 3)
        maxSpacetimeGaps = spacetimeGaps
        changeSkin('yoru')
        songYoru.currentTime = 0;
        songYoru.play();
        songYoru.volume = 0.9;
        text.innerHTML = "Você entrou em uma brecha no espaço-tempo!"
        perfil.src = "../midia/personagem/perfil/yoru.png"
        updateAbilityBar(100, true)
      } else {
        // Super velocidade (Flash)
        typeAbility = 2
        changeSkin('flash')
        songFlash.currentTime = 0;
        songFlash.play();
        songFlash.volume = 0.3;
        text.innerHTML = "Você pegou um super-velocidade!"
        perfil.src = "../midia/personagem/perfil/flahs.png"
        startAbilityTimer(50)
      }

      // Mostrar feedback positivo
      overlay.remove()
      resumeGame()
    } else {
      // Resposta errada - perder vida
      trianguloActive = false
      triangulo = false

      
      if (lives > 1) {
        if (lives == 3) {
          document.querySelectorAll('.coracao')[2].style.display = 'none'
        } else if (lives == 2) {
          document.querySelectorAll('.coracao')[1].style.display = 'none'
        }
        lives -= 1
        text.innerHTML = "Errou! Menos uma vida! Você tem mais " + lives + " vidas!"
        overlay.remove()
        resumeGame()
      } else {
        // Game over
        document.querySelectorAll('.coracao')[0].style.display = 'none'
        lives = 0
        overlay.remove()
        endGame('Você tropeçou e não conseguiu chegar a tempo!')
      }
    }
  }

  function startAbilityTimer(duration) {
    if (abilityTimer) {
      clearInterval(abilityTimer)
      triangulo = false
    }

    let remainingTime = duration
    const totalDuration = duration
    timeAbility = 1

    abilityTimer = setInterval(() => {
      remainingTime -= 1

      const percentage = (remainingTime / totalDuration) * 100
      updateAbilityBar(percentage)

      if (remainingTime <= 0) {
        clearInterval(abilityTimer)
        abilityTimer = null
        songFlash.pause();
        songYoru.pause()
        music.play()
        timeAbility = 0
        typeAbility = 0
        updateAbilityBar(0)
        changeSkin('normal')
        text.innerHTML = textPadrao()
        perfil.src = "../midia/personagem/perfil/kaito.png"
      }
    }, 100)
  }

  function changeSkin(skinName) {
    skins.forEach(skin => {
      if (skin.dataset.skin === skinName) {
        skin.classList.add('active')
      } else {
        skin.classList.remove('active')
      }
    })
  }

  function startGame() {
    if (!start && spacetimeGaps == 0) {
      const music = document.getElementById('music');
      music.play();
      music.volume = 0.05; // Diminui o volume em 0.1 (ou 10%)
      createObstacle(1)
      scheduleNextObstacle()
      start = true
      startSpeedIncrease()
      createTimeDisplay()
      updateTimeDisplay()
    }
  }

  function performJump() {
    if (trianguloActive){
      trianguloActive = false
    } else {
      if (!isJumping && start && spacetimeGaps == 0 && !isQuestionActive) {
        songJump.play()
        songJump.volume = 0.1;
        isJumping = true
        jump()
      }
    }
  }

  function command(e) {
    if (e.keyCode === 32 && spacetimeGaps == 0 && !isQuestionActive) {
      e.preventDefault()
      startGame()
      performJump()
    }
  }

  document.addEventListener('keydown', command)

  document.addEventListener('touchstart', (e) => {
    if (!isQuestionActive) {
      e.preventDefault()
      startGame()
      performJump()
    }
  })

  document.addEventListener('click', (e) => {
    if (!isQuestionActive) {
      startGame()
      performJump()
    }
  })

  let studentPosition = 0
  let maxSpacetimeGaps = 0

  function jump() {
    let height = 0
    let maxHeight = 15

    if (typeAbility == 1) {
      maxHeight = 30
    }

    let upHigh = setInterval(function() {
      studentPosition += 30
      height++
      studentPosition = studentPosition * gravity
      studentContainer.style.bottom = studentPosition + 'px'

      if (height >= maxHeight) {
        clearInterval(upHigh)

        let downFall = setInterval(function() {
          if (typeAbility == 1) {
            studentPosition -= 0
          } else {
            studentPosition -= 5
          }

          height--
          studentPosition = studentPosition * gravity
          studentContainer.style.bottom = studentPosition + 'px'

          if (height <= 0) {
            clearInterval(downFall)
            studentPosition = 0
            studentContainer.style.bottom = '0px'
            isJumping = false
          }
        }, 20)
      }
    }, 20)
  }

  function moveObstacle(obstacle, typer) {
    let obstaclePosition = window.innerWidth + 1000

    obstacle.style.left = obstaclePosition + 'px'

    const obsData = {
      element: obstacle,
      type: typer,
      moveInterval: null,
      paused: false
    }

    allObstacles.push(obsData)

    obsData.moveInterval = setInterval(function() {
      if (isGameOver) {
        clearInterval(obsData.moveInterval)
        return
      }

      obstaclePosition -= 10 * gameSpeed
      obstacle.style.left = obstaclePosition + 'px'

      // Colisão - PROTEÇÃO: não detecta colisão durante perguntas
      if (obstaclePosition > 0 && obstaclePosition < 64 && studentPosition < 27 && !obstacle.processado && !isQuestionActive) {
        obstacle.processado = true

        if (typer == 1) {
          if (obstacle.parentNode) {
            grid.removeChild(obstacle)
          }

          obstacle.vidaPerdida = true
          pauseGame()
          showQuestion()
        } else {
          if (spacetimeGaps > 0 && !obstacle.atravessado) {
            obstacle.atravessado = true
            spacetimeGaps -= 1

            const percentage = (spacetimeGaps / maxSpacetimeGaps) * 100
            updateAbilityBar(percentage, true)

            if (spacetimeGaps == 2) {
              text.innerHTML = "Você pode atravessar mais " + spacetimeGaps + " obstáculos!"
            } else if (spacetimeGaps == 1) {
              text.innerHTML = "Você pode atravessar mais " + spacetimeGaps + " obstáculo!"
            } else if (spacetimeGaps == 0) {
              updateAbilityBar(0, true)
              maxSpacetimeGaps = 0
              changeSkin('normal')
              text.innerHTML = textPadrao()
              perfil.src = "../midia/personagem/perfil/kaito.png"
            }
          } else if (!obstacle.atravessado && spacetimeGaps == 0) {
            endGame('Você tropeçou e não conseguiu chegar a tempo!')
          }
        }
      }

      // Perda de vida por passar - PROTEÇÃO: não perde vida durante perguntas
      if (obstaclePosition < -60 && !obstacle.vidaPerdida && !isQuestionActive) {
        clearInterval(obsData.moveInterval)
        if (obstacle.parentNode) {
          grid.removeChild(obstacle)
        }

        if (typer == 1) {
          obstacle.vidaPerdida = true
          triangulo = false

          if (lives == 1) {
            endGame('Você tropeçou e não conseguiu chegar a tempo!')
          } else {
            if (lives == 3) {
              document.querySelectorAll('.coracao')[2].style.display = 'none'
            } else if (lives == 2) {
              document.querySelectorAll('.coracao')[1].style.display = 'none'
            }
            lives -= 1
            text.innerHTML = "Menos uma vida! Você tem mais " + lives +" vidas!"
          }
        }
      }
    }, 20)
  }

  function endGame(message, typer) {
    theEnd.innerHTML = message
    isGameOver = true

    window.location.href = "../theEnd/lost/kaitoPassedOut/";

    if (body.firstChild) {
      body.removeChild(body.firstChild)
    }
    while (grid.firstChild) {
      grid.removeChild(grid.lastChild)
    }
  }

  function createObstacle(typer) {
    if (isGameOver || isQuestionActive) return

    const obstacle = document.createElement('div')

    obstacle.style.position = 'absolute'
    obstacle.style.width = '64px'
    obstacle.style.height = '64px'
    obstacle.style.bottom = '0px'
    obstacle.style.zIndex = '999'
    obstacle.style.backgroundSize = 'contain'
    obstacle.style.backgroundRepeat = 'no-repeat'
    obstacle.style.backgroundPosition = 'center'

    // Inicializar flags de controle
    obstacle.processado = false
    obstacle.atravessado = false
    obstacle.vidaPerdida = false

    if (typer == 1) {
      obstacle.classList.add('pergunta1')
      obstacle.style.backgroundImage = "url('../midia/pergunta/triangulo.png')"
    } else if (typer == 2) {
      obstacle.classList.add('arbustro')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/arbustro/arbustro.png')"
    } else if (typer == 3) {
      obstacle.classList.add('lamaC')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/lama/lama2.png')"
    } else if (typer == 4) {
      obstacle.classList.add('lamaE')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/lama/lama1.png')"
    } else if (typer == 5) {
      obstacle.classList.add('clover')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/pedra/pedrinhaDaClover.png')"
    } else if (typer == 6) {
      obstacle.classList.add('creeper')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/pedra/pedrinhaDoCreeper.png')"
    } else if (typer == 7) {
      obstacle.classList.add('rachadura')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/rachadura/rachadura.png')"
    } else if (typer == 8) {
      obstacle.classList.add('rachaduraX')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/rachadura/rachaduraX.png')"
    } else if (typer == 9) {
      obstacle.classList.add('rachaduraL')
      obstacle.style.backgroundImage = "url('../midia/obstaculo/rachadura/rachaduraL.png')"
    }

    grid.appendChild(obstacle)
    moveObstacle(obstacle, typer)
  }

  function scheduleNextObstacle() {
    if (isGameOver) return

    const baseTime = timeAbility > 0 && typeAbility == 2 ? 3000 : 1500
    const adjustedTime = baseTime / gameSpeed
    const randomTime = Math.random() * adjustedTime + adjustedTime

    setTimeout(() => {
      let typeOfObstacle = 0

      if (timeAbility == 0 && spacetimeGaps == 0 && triangulo == false) {
        typeOfObstacle = Math.floor(Math.random() * 5) + 1
      } else {
        typeOfObstacle = Math.floor(Math.random() * 4) + 2
      }

      if (typeOfObstacle === 1) {
        createObstacle(1)
        triangulo = true
      } else if (typeOfObstacle === 2) {
        createObstacle(2)
      } else if (typeOfObstacle === 3) {
        const subType = Math.floor(Math.random() * 2) + 1
        if (subType === 1) {
          createObstacle(3)
        } else {
          createObstacle(4)
        }
      } else if (typeOfObstacle === 4) {
        const subType = Math.floor(Math.random() * 2) + 1
        if (subType === 1) {
          createObstacle(5)
        } else {
          createObstacle(6)
        }
      } else if (typeOfObstacle === 5) {
        const subType = Math.floor(Math.random() * 3) + 1
        if (subType === 1) {
          createObstacle(7)
        } else if (subType === 2) {
          createObstacle(8)
        } else {
          createObstacle(9)
        }
      }

      scheduleNextObstacle()
    }, randomTime)
  }

  function startSpeedIncrease() {
    if (gameTimer) clearInterval(gameTimer)

    gameTimer = setInterval(() => {
      if (!isGameOver && start) {
        gameTime++
        updateTimeDisplay()

        if (typeAbility === 2) {
          gameTime++
          updateTimeDisplay()
        }

        if (gameTime >= maxGameTime) {
          winGame()
          return
        }

        if (gameTime % 10 === 0 && gameSpeed < 2) {
          gameSpeed += 0.1
        }
      }
    }, 1000)
  }

  function winGame() {
    isGameOver = true
    if (gameTimer) clearInterval(gameTimer)
    if (abilityTimer) clearInterval(abilityTimer)

    text.innerHTML = 'VOCÊ VENCEU! Chegou a tempo para a aula! 🎉'
    window.location.href = "../theEnd/won/1/";

    if (body.firstChild && body.firstChild !== theEnd.parentElement) {
      body.removeChild(body.firstChild)
    }
    while (grid.firstChild) {
      grid.removeChild(grid.lastChild)
    }
  }

  function textPadrao() {
    const textos = [
      "Caramba, o tempo tá passando!",
      "Eu acho que não vou chegar a tempo.", 
      "Tudo está ficando rápido ou eu estou correndo mais rápido?",
      "Corre calabreso! Não temos tempo.",
      "Uai, corre mais manin."
    ]

    const textoAtual = text.innerHTML

    if (textos.includes(textoAtual)) {
      return textoAtual
    }

    const indiceAleatorio = Math.floor(Math.random() * textos.length)
    return textos[indiceAleatorio]
  }

  function createTimeDisplay() {
    // BUG CORRIGIDO: Verificar se já existe antes de criar
    if (document.getElementById('timerContainer')) return

    // Adicionar estilos CSS responsivos
    const style = document.createElement('style')
    style.textContent = `

      #timerContainer {
        flex-shrink: 0;
        height: 40px;
        width: auto;
        aspect-ratio: 2 / 1;
        background-image: url('../midia/baseDoTime.png');
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        margin-right: 10px;
      }

      #timerText {
        font-family: "Micro 5", sans-serif;
        font-size: clamp(16px, 4vh, 40px);
        color: black;
        font-weight: bold;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes feedbackPop {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
    `
    document.head.appendChild(style)

    const timerContainer = document.createElement('div')
    timerContainer.id = 'timerContainer'

    const timerText = document.createElement('span')
    timerText.id = 'timerText'
    timerText.textContent = '7:00'

    timerContainer.appendChild(timerText)

    // Adicionar dentro da dialog-box
    const dialogBox = document.querySelector('.dialog-box')
    if (dialogBox) {
      dialogBox.appendChild(timerContainer)
    } else {
      document.body.appendChild(timerContainer)
    }
  }

  function updateTimeDisplay() {
    const timerText = document.getElementById('timerText')
    if (timerText) {
      const remainingTime = maxGameTime - gameTime
      const minutes = Math.floor(remainingTime / 60)
      const seconds = remainingTime % 60
      timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }
})