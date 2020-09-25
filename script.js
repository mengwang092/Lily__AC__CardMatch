// 遊戲狀態
const GAME_STATE = {
    FirstCardAwaits: "FirstCardAwaits",
    SecondCardAwaits: "SecondCardAwaits",
    CardsMatchFailed: "CardsMatchFailed",
    CardsMatched: "CardsMatched",
    GameFinished: "GameFinished",
}

// 撲克牌花色陣列
const Symbols = [
    'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
    'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
    'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
    'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

const view = {

    // 牌背
    getCardElement(index) {
        return `
        <div data-index="${index}" class="card back"></div>
        `
    },

    // 牌面
    // 屬性與函式/變數名稱相同時可省略
    // 原 getCardElement: getCardElement() {...}
    getCardContent(index) {
        const number = this.transformNumber((index % 13) + 1)
        const symbol = Symbols[Math.floor(index / 13)]
        return `
        <div class="card">
            <p>${number}</p>
            <img src="${symbol}" alt="">
            <p>${number}</p>
        </div>
        `
    },

    transformNumber(number) {
        switch(number) {
            case 1:
                return 'A'
            case 11:
                return 'J'
            case 12: 
                return 'Q'
            case 13:
                return 'K'
            default:
                return number
        }
    },

    displayCards (indexes) {
        const rootElement = document.querySelector('#cards')
        // 迭代出的陣列用 join 轉為字串給 index 使用
        rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('');
    },
    
    flipCards (...cards) {
        console.log(cards)
        cards.map(card => {
            if (card.classList.contains('back')) {
                // 回傳正面
                card.classList.remove('back')
                card.innerHTML = this.getCardContent(Number(card.dataset.index))
                return
            }
            // 回傳背面
            card.classList.add('back')
            card.innerHTML = null
        })
    },
    pairCards (...cards) {
        cards.map(card => {
            card.classList.add('paired')
        })
    },

    // 渲染分數以及嘗試次數
    renderScore (score) {
        document.querySelector('.score').innerHTML = `Score: ${score}`;
    },
    renderTriedCounts (counts) {
        document.querySelector('.tried').innerHTML = `You've tried: ${counts} times`;
    },

    // 動畫
    appendWrongAnimation (...cards) {
        cards.map(card => {
            card.classList.add('wrong')
            card.addEventListener('animationend', event => {
                // 此監聽事件只執行一次（拿掉 wrong class）
                event.target.classList.remove('wrong'),{ once:true }
            })
        })
    },

    // 遊戲結束顯示
    showGameFinished () {
        const div = document.createElement('div')
        div.classList.add('completed')
        div.innerHTML = `
          <h1>Complete!</h1>
          <p>Score: ${model.score}</p>
          <p>You've tried: ${model.triedCounts} times</p>
        `
        const header = document.querySelector('.header')
        header.before(div)
      }
}


const utility = {
    getRandomNumberArray(count) {
        // 洗牌，每次取出最後一張牌與隨機一張牌交換
        const number = Array.from(Array(count).keys())
        for (let index = number.length -1 ; index > 0 ; index --) {
            let randomIndex = Math.floor(Math.random() * (index + 1));
            [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
        }
        return number
    }
}

const controller = {
    currentState: GAME_STATE.FirstCardAwaits,
    generateCards() {
        view.displayCards(utility.getRandomNumberArray(52))
    },

    dispatchCardAction (card) {
        // 如果不是牌背。(那就是牌面，牌面不觸發任何行為，return終止函式)
        if (!card.classList.contains('back')) {
            return
        }
        switch (this.currentState) {
            // 狀態：未翻牌
            case GAME_STATE.FirstCardAwaits:
                // 從 view 擷取翻牌資料
                view.flipCards(card)
                // 使 model.revealedCards 也得到資料
                model.revealedCards.push(card)
                // 改變狀態至等待第二張牌
                this.currentState = GAME_STATE.SecondCardAwaits
                break

                // 狀態：等待第二張牌
                case GAME_STATE.SecondCardAwaits:
                    // 嘗試次數+1
                    view.renderTriedCounts(++model.triedCounts)
                    // 從 view 擷取翻牌資料
                    view.flipCards(card)
                    // 使 model.revealedCards 也得到資料
                    model.revealedCards.push(card)

                // if else 判斷兩張牌是否配對成功

                if (model.isRevealedCardsMatched()) {
                    view.pairCards(model.revealedCards[0])
                    view.pairCards(model.revealedCards[1])
                    // 牌組配對成功
                    this.currentState = GAME_STATE.CardsMatched
                    // 分數+10
                    view.renderScore(model.score += 10)
                    // 陣列初始化
                    model.revealedCards = []
                    // 如果分數已滿，載入遊戲結束畫面
                    if (model.score === 260) {
                        console.log('showGameFinished')
                        this.currentState = GAME_STATE.GameFinished
                        view.showGameFinished()
                        return
                    }
                    // 判斷結束，改變狀態至等待第一張牌
                    this.currentState = GAME_STATE.FirstCardAwaits
                } else {
                    // 牌組配對失敗；改變遊戲狀態至配對失敗
                    this.currentState = GAME_STATE.CardsMatchFailed
                    view.appendWrongAnimation(...model.revealedCards)
                    setTimeout(() => {
                        view.flipCards(model.revealedCards[0])
                        view.flipCards(model.revealedCards[1])
                        // 陣列初始化
                        model.revealedCards = []
                        // 判斷結束，改變狀態至等待第一張牌
                        this.currentState = GAME_STATE.FirstCardAwaits
                    }, 1000)
                }
                break
        }
        console.log('this.currentState', this.currentState)
        console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
    }
}
controller.generateCards()


const model = {
    revealedCards: [],
    score: 0,
    triedCounts: 0,

    isRevealedCardsMatched() {
        return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    }
}



document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', event => {
        controller.dispatchCardAction(card)
    })
})