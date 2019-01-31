<template>
    <SheetBase>
        <g v-for="(dot, index) in dots" :key="`dot-${index}`" class="dots">
            <!-- Plain Circle version -->
            <!-- <circle
                :cx="dot.x"
                :cy="dot.y"
                :r="r"
                :class="{ inactive: dot.image === '' }"
                class="dot"
            ></circle> -->

            <SheetRest v-if="dot.image === ''" :x="dot.x" :y="dot.y" />

            <SheetNote
                v-else
                :x="dot.x - 21"
                :y="dot.y - 60"
                :disabled="dot.image === ''"
                class="dot"
            />

            <image
                :href="dot.image"
                :set="(factor = 0.8)"
                :x="dot.x - r * factor + 2"
                :y="dot.y - r * factor + 2.5"
                :width="r * 2 * factor"
            />
        </g>
    </SheetBase>
</template>

<script>
import SheetBase from './SheetBase'
import SheetNote from './SheetNote'
import SheetRest from './SheetRest'

export default {
    components: {
        SheetBase,
        SheetNote,
        SheetRest,
    },

    data() {
        return {
            dots: [],
        }
    },
}
</script>

<style></style>
