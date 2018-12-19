import soundbanks from './soundbanks'

const defaultBankId = 'aula'

export const store = {
    state: {
        bank: soundbanks.find(bank => bank.id === defaultBankId),
        banks: soundbanks,
        sampleActive: null,
        bpm: 60,
        dot: 3,
        dotActive: 0,
        dots: [],
        players: {},
        playing: false,
        showSheet: true,
    },
}
