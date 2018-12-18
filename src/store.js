import soundbanks from './soundbanks'

const defaultBankId = 'aula'

export const store = {
    state: {
        bank: soundbanks.find(bank => bank.id === defaultBankId),
        banks: soundbanks,
        bpm: 60,
        dot: 4,
        dotActive: 0,
        dots: [],
        players: {},
        playing: false,
        recording: false,
        showSheet: true,
    },
}
