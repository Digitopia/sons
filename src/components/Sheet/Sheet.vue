<template>
    <div class="sheetContainer">
        <SheetVexFlow />
    </div>
    <!-- <SheetLayout ref="SheetLayout" :numerator="dot"> -->
    <!-- <SheetCustom /> -->
    <!-- </SheetLayout> -->
</template>

<script>
import { mapState } from 'vuex'

import SheetVexFlow from './SheetVexFlow'
import SheetLayout from './SheetLayout'
// import SheetCustom from './SheetCustom'

export default {
    components: {
        // SheetLayout,
        SheetVexFlow,
        // SheetCustom,
    },

    computed: {
        ...mapState(['dot']),
    },
}
</script>

<style lang="scss"></style>
