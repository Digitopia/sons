<template>
    <div class="sheetContainer">
        <SheetLayout ref="SheetLayout" :numerator="dot">
            <SheetCustom />
        </SheetLayout>
    </div>
</template>

<script>
import { mapState } from 'vuex'

import SheetLayout from './SheetLayout'
import SheetCustom from './SheetCustom'

export default {
    components: {
        SheetLayout,
        SheetCustom,
    },

    computed: {
        ...mapState(['dot']),
    },
}
</script>

<style lang="scss"></style>
