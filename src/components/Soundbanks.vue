<template>
    <div id="soundbank">
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th colspan="100%" class="bank-title">
                    <span class="left" @click="change(-1)">←</span>
                    {{ bank.name }}
                    <span class="right" @click="change(1)">→</span>
                </th>
            </tr>
            <tr v-for="register in Object.keys(bank.sounds)" :key="register">
                <th v-if="register === 'agudos'">Agudos
                    <br>(A)
                </th>
                <th v-else-if="register === 'medios'">Médios
                    <br>(M)
                </th>
                <th v-else-if="register === 'graves'">Graves
                    <br>(G)
                </th>
                <td v-for="(sound, idx) in bank.sounds[register]" :key="idx">
                    <img v-if="sound.icon.includes('holder')" v-holder="sound.icon">
                    <img
                        v-else
                        :src="require(`@/${sound.icon}`)"
                        @dragstart="drag"
                        @touchstart="touchstart(sound)"
                        :data-sample="sound.sample"
                        :class="{active: activeSound === sound}"
                        :alt="`image for ${sound.icon}`"
                    >
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
import { store } from '../store';
import Tone from 'tone';
import flat from 'array.prototype.flat';

// make v-holder work (since CDN didn't do the trick)
import VueHolder from 'vue-holderjs';
import Vue from 'vue';
Vue.use(VueHolder);

export default {
    name: 'Soundbanks',
    data() {
        return {
            shared: store.state,
            activeSound: undefined
        };
    },
    computed: {
        bank() {
            return this.shared.banks.find(
                bank => bank.id === this.shared.bankId
            );
        }
    },
    mounted() {
        this.loadBank(this.shared.bankId);
    },
    methods: {
        loadBank(bankId) {
            console.log(`Trying to load bank ${bankId}`);
            if (this.shared.players[bankId]) {
                console.log(`Soundbank ${bankId} is already loaded`);
                return;
            }
            const conf = this.shared.banks.find(bank => bank.id === bankId);
            const path = `sounds/${bankId}`;
            const sounds = Object.values(conf.sounds);
            const flatten = flat(sounds);
            const urls = flatten.map(sound => `${path}/${sound.sample}`);
            let mappings = {};
            urls.forEach(url => {
                const key = url.split('/').slice(-1);
                if (url !== '') mappings[key] = url;
            });
            store.addPlayersToBank(
                new Tone.Players(mappings).toMaster(),
                bankId
            );
        },
        change(dir) {
            let idx = this.getBankIdx(this.shared.bankId);
            idx += dir;
            if (idx > this.shared.banks.length - 1) {
                idx = this.shared.banks.length - 1;
                return;
            } else if (idx < 0) {
                idx = 0;
                return;
            }
            const bankId = this.shared.banks[idx].id;
            store.changeBankId(bankId);
            this.loadBank(bankId);
            this.$root.$emit('soundbank-change', bankId);
        },
        getBankIdx(bankId) {
            const ids = this.shared.banks.map(bank => bank.id);
            const idx = ids.findIndex(id => id === bankId);
            return idx;
        },
        drag(evt) {
            evt.dataTransfer.setData(
                'sample',
                evt.target.getAttribute('data-sample')
            );
            evt.dataTransfer.setData('src', evt.target.src);
        },
        touchstart(sound) {
            this.activeSound = sound !== this.activeSound ? sound : undefined;
        }
    }
};
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
