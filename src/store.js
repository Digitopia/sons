import Vue from 'vue'
import Vuex from 'vuex'

import soundbanks from '@/soundbanks'

Vue.use(Vuex)

import Tone from 'tone'

const store = new Vuex.Store({
    state: {
        banks: soundbanks,
        bankActive: 'aula',
        sampleActive: null,
        bpm: 60,
        dot: 2,
        dots: [2, 3, 4],
        dotActive: -1,
        notes: [],
        players: {},
        playing: false,
        showSheet: false,
        isPwa: false,
    },

    getters: {
        bank: state => {
            return state.banks.find(bank => bank.id === state.bankActive)
        },

        bankId: state => bankId(state),
    },

    mutations: {
        changeDot(state, val) {
            if (val !== state.dot) state.dot = val
        },

        togglePlaying(state) {
            state.playing = !state.playing
        },

        setPlaying(state, val) {
            state.playing = val
        },

        setDotActive(state, val) {
            state.dotActive = val
        },

        setSampleActive(state, val) {
            state.sampleActive = val
        },

        setNote(state, { idx, note }) {
            state.notes[idx] = note
        },

        setIsPwa(state, val) {
            state.isPwa = val
        },

        changeBank(state, dir) {
            const idx = bankId(state)
            if (idx + dir >= state.banks.length || idx + dir < 0) return
            const bank = state.banks[idx + dir]
            this.loadBank(bank.id)
        },

        toggleSheet(state) {
            state.showSheet = !state.showSheet
        },

        setBpm(state, val) {
            state.bpm = val
        },

        loadBank(state, id) {
            console.log(`Trying to load bank ${id}`)
            if (state.players[id]) {
                console.log(`Soundbank ${id} is already loaded`)
                return
            }
            const bank = state.banks.find(bank => bank.id === id)
            const { sounds } = bank
            const path = `sounds/${id}`
            const paths = sounds.map(sound => `${path}/${sound.sample}`)
            const mappings = {}
            paths.forEach((path, idx) => (mappings[sounds[idx].sample] = path))
            state.players[id] = new Tone.Players(mappings).toMaster()
            console.log(`Loaded bank ${id}`)
        },
    },
})

// Putting this getter outside, since vue doesn't allow for mutations to access getters
function bankId(state) {
    return state.banks.findIndex(bank => bank.id === store.getters.bank.id)
}

export default store

export function NoteFactory(bank = '', sample = '') {
    return {
        bank,
        sample,
    }
}
