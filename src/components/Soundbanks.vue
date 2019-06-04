<template>
    <table class="soundbank">
        <tr>
            <th colspan="100%" class="bank-title">
                <span
                    class="left"
                    :class="{ disabled: firstBank }"
                    @click.prevent.stop="change(-1)"
                    @touchstart.prevent.stop="change(-1)"
                    >←</span
                >
                {{ bank.name }}
                <span
                    class="right"
                    :class="{ disabled: lastBank }"
                    @click.prevent.stop="change(1)"
                    @touchstart.prevent.stop="change(1)"
                    >→</span
                >
            </th>
        </tr>
        <tr v-for="register in registers" :key="register">
            <th>
                {{ register | wordize }}
                <!-- <br /> -->
                <!-- ({{ register | firstLetter }}) -->
            </th>
            <td v-for="(sound, idx) in getSounds(register, bank.id)" :key="idx">
                <img
                    v-if="sound.icon.includes('holder')"
                    v-holder="sound.icon"
                />
                <img
                    v-else
                    :src="sound.icon"
                    :alt="`image for ${sound.icon}`"
                    :class="{ active: sampleActive === sound }"
                    :data-sample="sound.sample"
                    @dragstart="drag($event, sound)"
                    @dragend="dragend"
                    @click.prevent.stop="touchstart(sound)"
                    @touchstart.prevent.stop="touchstart(sound)"
                />
            </td>
        </tr>
    </table>
</template>

<script>
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import VueHolder from 'vue-holderjs'
Vue.use(VueHolder)

export default {
    name: 'Soundbanks',

    filters: {
        wordize: register => {
            if (register === 'agudos') return 'Agudos'
            if (register === 'medios') return 'Médios'
            if (register === 'graves') return 'Graves'
        },

        firstLetter: str => {
            return str.charAt(0).toUpperCase()
        },
    },

    data() {
        return {
            registers: ['agudos', 'medios', 'graves'],
            dragging: false,
        }
    },

    computed: {
        ...mapState(['banks', 'sampleActive', 'players']),

        ...mapGetters(['bank']),

        firstBank() {
            return this.bank.id === this.banks[0].id
        },

        lastBank() {
            return this.bank.id === this.banks[this.banks.length - 1].id
        },
    },

    mounted() {
        this.$store.commit('loadBank', this.bank.id)
    },

    methods: {
        ...mapMutations(['loadBank', 'changeBankActive', 'setSampleActive']),

        getSounds(register, bankId) {
            const bank = this.banks.find(bank => bank.id === bankId)
            return bank.sounds.filter(sound => sound.register === register)
        },

        change(dir) {
            const idx = this.banks.findIndex(bank => bank.id === this.bank.id)
            if (idx + dir >= this.banks.length || idx + dir < 0) return
            this.changeBankActive(this.banks[idx + dir].id)
            this.loadBank(this.bank.id)
        },

        drag(evt, sound) {
            this.dragging = true
            this.touchstart(sound)
            evt.dataTransfer.setData(
                'sample',
                evt.target.getAttribute('data-sample')
            )
            evt.dataTransfer.setData('src', evt.target.src)
        },

        dragend() {
            this.dragging = false
        },

        touchstart(sound) {
            let sampleActive = sound !== this.sampleActive ? sound : undefined
            if (this.dragging && sampleActive === undefined)
                sampleActive = this.sampleActive
            this.setSampleActive(sampleActive)
        },
    },
}
</script>

<style lang="scss">
table {
    border: 1px solid var(--light-grey);
    box-shadow: 3px 3px 5px var(--light-grey);
    border-radius: 5px !important;
    border-spacing: 0;
    tr:first-child th {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }
    tr:last-child th {
        border-bottom-left-radius: 5px;
    }
    tr:last-child td:last-of-type {
        border-bottom-right-radius: 5px;
    }
}

.soundbank {
    text-align: center;
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
        &.disabled {
            color: white;
            opacity: 0.5;
            &:hover {
                cursor: default;
            }
        }
    }
}
</style>
