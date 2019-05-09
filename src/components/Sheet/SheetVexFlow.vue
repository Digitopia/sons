<script>
import { mapState } from 'vuex'

export default {
    computed: {
        ...mapState(['notes', 'dot', 'banks']),
    },

    watch: {
        dot() {
            this.init()
            this.update()
        },
    },

    created() {
        this.$root.$on('dotstep', this.dotStepped)
        this.$root.$on('dotchange', this.dotChanged)
        this.$root.$on('dotsclear', this.clear)
        this.vfNotes = this.getVfNotes()
    },

    mounted() {
        this.init()
        this.update()
    },

    methods: {
        init() {
            const VF = window.Vex.Flow

            // Remove previous sheet if already exists (when changing dots for instance)
            const el = document.querySelector('#sheet > svg')
            if (el) {
                this.clearSvg()
                el.remove()
            }

            this.renderer = new window.Vex.Flow.Renderer(
                document.querySelector('.sheetContainer'),
                VF.Renderer.Backends.SVG
            )
            this.renderer.resize(
                this.$parent.$el.clientWidth,
                this.$parent.$el.clientHeight
            )

            // Create a stave at position 10, 40 of width 400 on the canvas.
            this.stave = new VF.Stave(10, 0, 300, {
                // vertical_bar_width: 10, // width around vertical bar end-marker
                glyph_spacing_px: 20,
                num_lines: 5,
                // fill_style: '#999999',
                left_bar: false, // draw vertical bar on left
                right_bar: false, // draw vertical bar on right
                // spacing_between_lines_px: 14, // in pixels
                space_above_staff_ln: 0, // in staff lines
                space_below_staff_ln: 0, // in staff lines
                // top_text_position: 100, // in staff lines
            })

            // // Format and justify the notes to 400 pixels.
            // var formatter = new VF.Formatter()
            //     .joinVoices([voice])
            //     .format([voice], 400)

            this.context = this.renderer.getContext()

            this.context.scale(1.25, 1.25)

            this.stave.addTimeSignature(`${this.dot}/4`)
            this.stave.setContext(this.context).draw()
        },

        getVfNotes() {
            const VF = window.Vex.Flow
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
            }
            return vfNotes
        },

        update(draw = true) {
            this.clearSvg()
            this.group = this.context.openGroup()
            this.vfNotes = this.getVfNotes()
            if (draw) this.draw()
        },

        clearSvg() {
            if (this.group) {
                this.context.svg.removeChild(this.group)
                this.group = null
            }
        },

        draw() {
            const VF = window.Vex.Flow
            const beams = VF.Beam.generateBeams(this.vfNotes)
            VF.Formatter.FormatAndDraw(this.context, this.stave, this.vfNotes)
            beams.forEach(beam => {
                beam.setContext(this.context).draw()
            })
            this.context.closeGroup()
        },

        dotChanged(evt) {
            this.update()
            console.log(this.vfNotes)
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

        getStaveNoteFromIdx(idx) {
            this.vfNotes.reduce()
        },

        dotStepped({ idx, note, time }) {
            // Highlight current note
            // const el = document.querySelectorAll('.vf-stavenote')[idx]
            // console.log(el)
            // el.setAttribute('fill', 'var(--accent)')

            // 0 1 2 3 4
            // 8 (0.5) 8 (0.5) 4 (1)

            // TODO: convert idx of dots to idx of notation (harder than it seems)
            // const tick = idx * 0.5
            // let idxHighlight
            // this.vfNotes.reduce((total, val, index, arr) => {
            //     if (total >= tick) {
            //         console.log('finish going to return', index)
            //         idxHighlight = index
            //         arr.splice(1) // mutation in order to break from reduce
            //         console.log('this souldnt run')
            //     }
            //     console.log('this might not run')
            //     const duration = this.vfNotes[index].duration
            //     const durationTicks = this.convertVfDurationToHuman(duration)
            //     // console.log({ duration, durationTicks })
            //     console.log('going to next iter with', total + durationTicks)
            // }, 0)

            const tick = idx * 0.5
            const accumTick = (total, notes, index) => {
                if (total > tick) {
                    console.log('returning with', { total, tick, index })
                    return index - 1
                } else if (total === tick) return index
                const duration = notes[index].duration
                const durationTicks = this.convertVfDurationToHuman(duration)
                return accumTick(total + durationTicks, notes, ++index)
            }
            const idxHighlight = accumTick(0, this.vfNotes.slice(0), 0)

            console.log({ idxHighlight })

            try {
                this.update(false)
                this.vfNotes[idxHighlight].setStyle({
                    fillStyle: 'var(--accent)',
                    strokeStyle: 'var(--accent)',
                })
                this.draw()
            } catch (e) {
                console.log('failint silently')
            }

            // const r = this.r
            // const dot = this.$refs[`dot-${idx}`]
            // const animationSpeed = 0.08
            // const originalR = this.dots[idx].isSmall ? 0.75 * this.r : this.r
            // TweenMax.to(dot, animationSpeed, {
            //     attr: { r: r * 1.5 },
            //     onComplete: () => {
            //         TweenMax.to(dot, animationSpeed, { attr: { r: originalR } })
            //     },
            // })
            // if (note.sample === '') return
            // if (idx === 0) this.players[note.bank].volume.value = 0
            // else if (idx % 2 === 0) this.players[note.bank].volume.value = -6
            // this.players[note.bank].get(note.sample).start(time)
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

<style lang="scss">
#foo {
    // width: 100%;
    height: 100px;
    margin: 0 auto;
}

// .vf-notehead path {
//     fill: var(--accent);
// }

text {
    // font-family: 'Courier New', Courier, monospace;
    font-family: 'Bravura';
}
</style>
