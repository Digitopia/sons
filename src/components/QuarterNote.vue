<template>
    <svg
        class="quarter-note"
        width="30"
        height="50"
        :class="{ disabled: disabled }"
    >
        <g transform="scale(1.6) translate(-434,-6)">
            <path
                class="notehead"
                d="M 451.09297,49.38984 C 454.48881,47.56987 456.29825,44.27529 455.18519,41.79688 C 453.99793,39.15324 449.91818,38.40716 446.07861,40.13151 C 442.23905,41.85587 440.08645,45.40091 441.27371,48.04454 C 442.46098,50.68818 446.54072,51.43426 450.38029,49.70991 C 450.62026,49.60214 450.86657,49.51117 451.09297,49.38984 z "
            />
            <path
                v-if="!disabled"
                class="stem"
                d="M 454.72547,43.05645 L 454.72547,9.46888"
            />
        </g>
    </svg>
</template>

<script>
export default {
    props: {
        disabled: {
            type: Boolean,
            default: false,
        },
    },
}
</script>

<style lang="scss">
.disabled {
    opacity: 0.3;
}

.notehead {
    fill: var(--accent);
    fill-rule: evenodd;
    stroke: none;
    stroke-width: 0.2;
    stroke-miterlimit: 4;
    stroke-dashoffset: 0;
    stroke-opacity: 1;
}

.stem {
    fill: none;
    fill-rule: evenodd;
    stroke: var(--accent);
    stroke-width: 1.5;
    stroke-linecap: butt;
    stroke-linejoin: miter;
    stroke-miterlimit: 4;
    stroke-dasharray: none;
    stroke-opacity: 1;
}
</style>
