import soundbanks from './soundbanks'

const defaultBankId = 'aula'

export const store = {
    state: {
        bank: soundbanks.find(bank => bank.id === defaultBankId),
        banks: soundbanks,
        sampleActive: null,
        bpm: 60,
        dot: 4,
        dotActive: -1,
        dots: [],
        players: {},
        playing: false,
        showSheet: true,
    },
}
