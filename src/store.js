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
        dot: 3,
        dots: [2, 3, 4],
        dotActive: -1,
        notes: [],
        players: {},
        playing: false,
        showSheet: true,
        isPwa: false,
    },

    getters: {
        bank: state => {
            return state.banks.find(bank => bank.id === state.bankActive)
        },

        ndots: state => {
            return state.dot * 2
        },
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

        setNotes(state, notes) {
            state.notes = notes
        },

        clearNotes(state) {
            state.notes.forEach(note => {
                note.sample = ''
                note.bank = ''
            })
        },

        setIsPwa(state, val) {
            state.isPwa = val
        },

        changeBankActive(state, bankActive) {
            state.bankActive = bankActive
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

export default store

export function NoteFactory(bank = '', sample = '') {
    return {
        bank,
        sample,
    }
}
