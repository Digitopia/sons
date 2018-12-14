import defaults from './defaults'

export const store = {
    state: {
        banks: defaults.soundbanks,
        bpm: defaults.bpm,
        dot: defaults.dot,
        dots: [],
        bank: {},
        players: {},
        bankId: defaults.bankId,
        players: {},
        playing: false,
        recording: false,
        showSheet: true
    },
    changeDot: function (dot) {
        if (dot === this.state.dot) return
        this.resetDots()
        this.state.dot = dot
    },
    resetDots: function () {
        this.state.dots.forEach(dot => {
            if (dot.sheetImage) dot.sheetImage.remove()
            if (dot.image) {
                dot.image.attr('src', '')
                dot.image.attr('xlink:href', '')
            }
            dot.sample = ''
            if (dot.sheetElem) dot.sheetElem.remove()
        })
        this.state.dots = []
    },
    changeBankId: function (bankId) {
        this.state.bankId = bankId
    },
    toggleSheet() {
        this.state.showSheet = !this.state.showSheet
    },
    addPlayersToBank(players, bankId) {
        this.state.players[bankId] = players
    },
    getActiveBank() {
        return this.state.banks.find(bank => bank.id === this.state.bankId)
    }

}
