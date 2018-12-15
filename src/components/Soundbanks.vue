<template>
    <div id="soundbank">
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th colspan="100%" class="bank-title">
                    <span class="left" @click="change(-1)">←</span>
                    {{ state.bank.name }}
                    <span class="right" @click="change(1)">→</span>
                </th>
            </tr>
            <tr v-for="register in registers" :key="register">
                <th>
                    {{ register | wordize }}<br>
                    ({{register | firstLetter}})
                </th>
                <td v-for="(sound, idx) in getSounds(register, state.bank.id)" :key="idx">
                    <img v-if="sound.icon.includes('holder')" v-holder="sound.icon">
                    <img
                        v-else
                        :src="require(`@/${sound.icon}`)"
                        :alt="`image for ${sound.icon}`"
                        :class="{active: activeSound === sound}"
                        :data-sample="sound.sample"
                        @dragstart="drag"
                        @touchstart="touchstart(sound)"
                    >
                </td>
            </tr>
        </table>
    </div>
</template>

<script>

import Vue from 'vue'

import { store } from '@/store'

import Tone from 'tone'
import VueHolder from 'vue-holderjs'
Vue.use(VueHolder)

export default {

    name: 'Soundbanks',

    data() {
        return {
            state: store.state,
            registers: ['agudos', 'medios', 'graves'],
            activeSound: null,
        }
    },

    filters: {
        wordize: function(register) {
            if (register === 'agudos') return 'Agudos'
            if (register === 'medios') return 'Médios'
            if (register === 'graves') return 'Graves'
        },
        firstLetter: function(str) {
            return str.charAt(0).toUpperCase()
        }
    },

    mounted() {
        this.loadBank(this.state.bank.id)
    },

    methods: {

        getSounds(register, bankId) {
            const bank = this.state.banks.find(bank => bank.id === bankId)
            return bank.sounds.filter(sound => sound.register === register)
        },

        loadBank(id) {
            console.log(`Trying to load bank ${id}`)
            if (this.state.players[id]) {
                console.log(`Soundbank ${id} is already loaded`)
                return
            }
            const bank = this.state.banks.find(bank => bank.id === id)
            const { sounds } = bank
            const path = `sounds/${id}`
            const paths = sounds.map(sound => `${path}/${sound.sample}`)
            const mappings = {}
            paths.forEach((path, idx) => mappings[sounds[idx].sample] = path)
            this.state.players[id] = new Tone.Players(mappings).toMaster(),
            console.log(`Loaded bank ${id}`)
        },

        change(dir) {
            const idx = this.state.banks.findIndex(bank => bank.id === this.state.bank.id)
            if (idx + dir >= this.state.banks.length || idx + dir < 0) return
            const bank = this.state.banks[idx+dir]
            this.state.bank = bank
            this.loadBank(bank.id)
        },

        drag(evt) {
            evt.dataTransfer.setData( 'sample', evt.target.getAttribute('data-sample') )
            evt.dataTransfer.setData('src', evt.target.src)
        },

        touchstart(sound) {
            this.activeSound = sound !== this.activeSound ? sound : undefined
        }
    }
}
</script>

<style lang="scss">
#soundbank {
    grid-area: soundbank;
    text-align: center;
    table {
        border: 1px solid var(--light-grey);
    }
    th {
        background: var(--dark-grey);
        color: white;
        font-weight: normal;
        font-size: 14px;
        padding: 8px;
    }
    .bank-title {
        font-size: 18px;
    }
    tr:nth-of-type(odd) {
        background: var(--light-grey);
        img {
            border: 1px solid white;
        }
    }
    tr:first-child th {
        background: var(--accent) !important;
    }
    td {
        padding: 3px;
        // border: 0.1px solid rgba(0, 0, 0, 0.3);
    }
    img {
        opacity: 0.8;
        border-radius: 100%;
        border: 1px solid var(--light-grey);
        width: 40px;
        height: 40px;
        &:hover {
            cursor: pointer;
        }
        &.active {
            background: var(--accent);
        }
    }
    span {
        align-items: center;
        &:hover {
            cursor: pointer;
        }
        &.left {
            float: left;
        }
        &.right {
            float: right;
        }
    }
}
</style>
