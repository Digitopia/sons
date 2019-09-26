<template>
    <div class="container mt-5">
        <h1>Gravações Caça Sons</h1>
        <p class="mt-5">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ipsam,
            delectus vitae animi eveniet excepturi omnis optio repellendus
            aspernatur, laudantium dolores cumque tempore! Quia quasi fugit id
            assumenda molestiae!
        </p>
        <!-- <div class="card-columns mt-5"> -->
        <div class="card-columns mt-5">
            <div v-for="(audio, idx) in audios" :key="idx" class="card">
                <!-- <div class="card"> -->
                <!-- <img
                    class="card-img-top"
                    :src="
                        `https://source.unsplash.com/random?classroom?sig=${idx}`
                    "
                /> -->
                <img class="card-img-top" :src="`/sons/${audio.image}`" />
                <div class="card-body">
                    <h5 class="card-title">{{ audio.title }}</h5>
                    <p class="card-text">
                        {{ audio.description }}
                    </p>
                    <audio controls>
                        <source :src="`${audio.audio}`" />
                    </audio>
                    <p class="card-text">
                        <small class="text-muted"
                            >Gravado em
                            {{
                                new Date(audio.date).toLocaleDateString()
                            }}</small
                        >
                    </p>
                </div>
            </div>
            <!-- </div> -->
        </div>
    </div>
    <!-- </div> -->
    <!-- </div> -->
</template>

<script>
export default {
    data() {
        return {
            audios: [],
        }
    },

    async created() {
        const url = 'all.json'
        const response = await fetch(url)
        const audios = await response.json()
        const sorted = audios.sort((a, b) => (a.date > b.date ? -1 : 1))
        console.log({ sorted })
        console.log(sorted.map(audio => audio.date))
        this.audios = sorted
        // TODO: sort by date
    },
}
</script>

<style lang="scss" scoped>
@import '~bootstrap/dist/css/bootstrap.min';

audio {
    width: 100%;
}

h1 {
    color: var(--accent);
}

.card-title {
    color: var(--accent);
}
</style>
