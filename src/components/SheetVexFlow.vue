<template>
    <div class="sheetContainer">
        <MountingPortal
            v-if="loaded"
            ref="portal"
            mount-to="#sheetId"
            append
            target-tag="g"
        >
            <defs>
                <!-- eslint-disable vue/attribute-hyphenation -->
                <!-- NOTE: make sure attr tableValues doesn't get converted to table-values -->
                <!-- NOTE: eslint handles this normally, but in this case doesn't since there's no svg wrapper element -->
                <filter id="f1">
                    <feComponentTransfer color-interpolation-filters="sRGB">
                        <feFuncR type="table" tableValues="1 0" />
                        <feFuncG type="table" tableValues="1 0" />
                        <feFuncB type="table" tableValues="1 0" />
                    </feComponentTransfer>
                </filter>
                <!-- eslint-enable vue/attribute-hyphenation-->
            </defs>
            <image
                v-for="(image, index) in vfImages"
                :key="index"
                :x="image.x"
                :y="image.y"
                :width="image.width"
                :height="image.height"
                :data-idx="image.idx"
                :data-order="image.order"
                v-bind="{
                    'xlink:href': image.src,
                    filter: !image.playing ? 'url(#f1)' : '',
                }"
            />
        </MountingPortal>
    </div>
</template>

<script>
import { MountingPortal } from 'portal-vue'
import { mapState, mapGetters } from 'vuex'
import Vex from 'vexflow'

const VF = Vex.Flow

export default {
    components: {
        MountingPortal,
    },

    data() {
        return {
            vfImages: [],
            loaded: false,
        }
    },

    computed: {
        ...mapState(['notes', 'dot', 'banks']),
        ...mapGetters(['ndots', 'getIcon']),
    },

    watch: {
        dot() {
            this.loaded = false
            console.log(this.$refs.portal)
            this.init()
            this.update()
            this.loaded = true
        },
    },

    created() {
        this.$root.$on('dotstep', this.dotStepped)
        this.$root.$on('dotchange', this.dotChanged)
        this.$root.$on('dotsclear', this.clear)
        this.$root.$on('stop', this.stop)
        this.$root.$on('debouncedresize', this.resize)
        this.vfNotes = this.getVfNotes()
    },

    mounted() {
        this.init()
        this.update()
        this.loaded = true
    },

    methods: {
        resize() {
            console.log('debounce resizing in vexflow')
        },

        init() {
            // Remove previous sheet if already exists (when changing dots for instance)
            // const el = document.querySelector('#sheet > svg')
            const el = document.querySelector('.sheetContainer > svg')
            if (el) {
                this.clearSvg()
                el.remove()
            }

            this.renderer = new VF.Renderer(
                document.querySelector('.sheetContainer'),
                VF.Renderer.Backends.SVG
            )

            // this.renderer.resize(200, 200) // TODO:

            const w = this.$el.clientWidth
            this.renderer.resize(
                w * 0.75,
                200
                // this.$parent.$el.clientHeight
            )

            this.renderer.ctx.svg.setAttribute('id', 'sheetId')

            // Create a stave at position x, y and of width 400 on the canvas
            this.stave = new VF.Stave(0, 0, w, {
                // vertical_bar_width: 10, // width around vertical bar end-marker
                glyph_spacing_px: 20,
                num_lines: 5,
                // fill_style: '#999999',
                // left_bar: false, // draw vertical bar on left
                // right_bar: false, // draw vertical bar on right
                // spacing_between_lines_px: 14, // in pixels
                space_above_staff_ln: 1, // in staff lines
                space_below_staff_ln: 1, // in staff lines
                // top_text_position: 100, // in staff lines
            })

            // // Format and justify the notes to 400 pixels.
            // var formatter = new VF.Formatter()
            //     .joinVoices([voice])
            //     .format([voice], 400)

            this.context = this.renderer.getContext()
            const scaleFactor = 1.25
            this.context.scale(scaleFactor, scaleFactor)

            this.renderer.ctx.svg.style.position = 'relative'
            this.renderer.ctx.svg.style.left = `-${w * (scaleFactor - 1)}px`

            this.stave.addTimeSignature(`${this.dot}/4`)
            this.stave.setContext(this.context).draw()
        },

        getVfNotes() {
            const vfNotes = []
            for (let i = 0; i < this.notes.length; i++) {
                const note = this.notes[i]
                const isRest = note.sample === ''
                const isOnBeat = i % 2 === 0
                const isNextRest =
                    i === this.notes.length - 1
                        ? false
                        : this.notes[i + 1].sample === ''
                const useFullRest = isRest && isOnBeat && isNextRest
                const { bank } = note
                let key
                if (bank) {
                    const bankDef = this.banks.find(
                        bank => bank.id === note.bank
                    )
                    const register = bankDef.sounds.find(
                        sound => sound.sample === note.sample
                    ).register
                    if (register === 'graves') key = 'e'
                    else if (register === 'medios') key = 'g'
                    else if (register === 'agudos') key = 'b'
                }
                const noteParams = {
                    keys: isRest ? ['b/4'] : [`${key}/4`],
                    duration: useFullRest ? '4r' : isRest ? '8r' : '8',
                }
                if (useFullRest) i++
                vfNotes.push(new VF.StaveNote(noteParams))
                vfNotes.forEach(vfNote =>
                    vfNote.setStyle({
                        fillStyle: 'black',
                        strokeStyle: 'black',
                    })
                )
            }
            return vfNotes
        },

        update(draw = true) {
            this.clearSvg()
            this.group = this.context.openGroup('vfNotes')
            this.vfNotes = this.getVfNotes()
            if (draw) {
                this.draw()
                this.drawIcons()
            }
            this.group.parentNode.insertBefore(
                this.group,
                this.$el.querySelector('.vue-portal-target')
            )
        },

        drawIcons() {
            this.vfImages = []
            for (let idx = 0; idx < this.ndots; idx++) {
                const vfIdx = this.convertNoteIdxToVfNoteIdx(idx)
                const vf = this.vfNotes[vfIdx]
                const { bank, sample } = this.notes[idx]
                if (!sample) continue
                const { x, y } = vf.note_heads[0]
                if (!vf.attrs.el) continue
                const notehead = vf.attrs.el.querySelector('.vf-notehead')
                let { width, height } = notehead.getBoundingClientRect()
                const factor = 0.7
                height *= factor
                // width *= factor
                const src = this.getIcon(bank, sample)
                this.vfImages.push({
                    vfIdx,
                    x: x - width / 8,
                    y: y - height / 2,
                    width,
                    height,
                    src,
                    playing: false,
                    order: this.vfImages.length,
                    idx,
                })
            }
        },

        clearSvg() {
            if (this.group) {
                this.context.svg.removeChild(this.group)
                this.group = null
            }
        },

        draw() {
            const beams = VF.Beam.generateBeams(this.vfNotes)
            VF.Formatter.FormatAndDraw(this.context, this.stave, this.vfNotes)
            beams.forEach(beam => {
                beam.setStyle({
                    fillStyle: 'black',
                    strokeStyle: 'black',
                })
                beam.setContext(this.context).draw()
            })
            this.context.closeGroup()
        },

        stop() {
            // NOTE: hacky but does the trick
            const paths = document.querySelectorAll(
                "#sheet path[fill='var(--accent)']"
            )
            paths.forEach(path => path.removeAttribute('fill'))

            const strokes = document.querySelectorAll(
                "#sheet path[stroke='var(--accent)"
            )
            strokes.forEach(stroke => stroke.setAttribute('stroke', 'black'))
        },

        dotChanged() {
            this.update()
        },

        /**
            Examples:
                8 (one 8th note) gets converted to 0.5
                4 (one quarter note) gets converted to 1
         */
        convertVfDurationToHuman(vfDuration) {
            if (vfDuration.charAt(0) === '4') return 1
            else if (vfDuration.charAt(0) === '8') return 0.5
        },

        convertNoteIdxToVfNoteIdx(noteIdx) {
            const tick = noteIdx * 0.5
            const accumTick = (total, notes, index) => {
                if (total > tick) {
                    return index - 1
                } else if (total === tick) return index
                const duration = notes[index].duration
                const durationTicks = this.convertVfDurationToHuman(duration)
                return accumTick(total + durationTicks, notes, ++index)
            }
            const vfIdx = accumTick(0, this.vfNotes.slice(0), 0)
            return vfIdx
        },

        dotStepped({ idx }) {
            const vfNoteIdx = this.convertNoteIdxToVfNoteIdx(idx)

            try {
                this.update(false)
                this.vfNotes[vfNoteIdx].setStyle({
                    fillStyle: 'var(--accent)',
                    strokeStyle: 'var(--accent)',
                })
                this.draw()
                this.vfImages.forEach(img => (img.playing = false))
                const img = this.$el.querySelector(`image[data-idx='${idx}']`)
                if (img) {
                    const vfImgOrder = img.getAttribute('data-order')
                    this.vfImages.forEach(img => (img.playing = false))
                    this.vfImages[vfImgOrder].playing = true
                }
            } catch (e) {
                console.error('tried to highlight an invalid vfNote', e.stack)
            }
        },

        clear() {
            this.vfNotes = []
            this.clearSvg()
            this.update()
        },
    },

    render(h) {
        return h()
    },
}
</script>
