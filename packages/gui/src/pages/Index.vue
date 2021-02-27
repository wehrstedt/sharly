<template>
  <div class="q-pa-md">
    <div class="row items-center justify-evenly" style="color: white">
      <h2>Sharly</h2>
    </div>

    <div class="row items-center justify-evenly full-width">
      <q-carousel
        v-model="slide"
        swipeable
        animated
        transition-prev="slide-right"
        transition-next="slide-left"
        height="auto"
        color="green"

        control-color="primary"
        class="rounded-borders full-width"
        style="max-width: 500px"
      >
        <q-carousel-slide name="open-content" class="column no-wrap flex-center">
          <open-content
            @go-back="slide='start-panel'"
          />
        </q-carousel-slide>
        <q-carousel-slide name="start-panel" class="column no-wrap flex">
          <div class="row" @click="slide='open-content'" style="padding-top: 10px">
            <div class="column col-4">
              <q-icon name="mdi-folder-open" color="primary" size="70px" />
            </div>
            <div class="column no-wrap flex-center col-8" style="font-size:1.5em">
              Inhalt öffnen
            </div>
          </div>

          <q-separator color="grey" class="q-mt-md q-mb-md"/>

          <div class="row" @click="slide='share-content'">
            <div class="column no-wrap flex-center col-8" style="font-size:1.5em">
              Daten teilen
            </div>
            <div class="column col-4">
              <q-icon name="mdi-share-variant" color="primary" size="70px" />
            </div>
          </div>
        </q-carousel-slide>
        <q-carousel-slide name="share-content" class="column no-wrap">
          <share-content
            @go-back="slide='start-panel'"
          />
        </q-carousel-slide>
      </q-carousel>
    </div>
  </div>
</template>

<style>
.q-carousel__slide {
  padding-top: 0px;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import ShareContent from "../components/ShareContent.vue";
import OpenContent from "../components/OpenContent.vue";

export default defineComponent({
  name: "PageIndex",
  components: { OpenContent, ShareContent },
  data () {
    return {
      slide: "start-panel",
      lorem: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Itaque voluptatem totam, architecto cupiditate officia rerum, error dignissimos praesentium libero ab nemo provident incidunt ducimus iusto perferendis porro earum. Totam, numquam?"
    };
  }
});
</script>
