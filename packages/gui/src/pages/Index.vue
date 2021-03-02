<template>
  <div class="q-pa-md">
    <div class="row items-center justify-evenly q-mt-xl" style="color: white">
      <q-icon name="mdi-emoticon-wink" style="font-size: 80px" />
    </div>
    <div class="row items-center justify-evenly" style="color: white">
      <h2 class="q-mt-lg">SHARLY</h2>
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
        :style="'max-width: 500px; background-color: ' + backgroundColor"
      >
        <q-carousel-slide
          name="open-content"
          class="column no-wrap flex-center"
        >
          <open-content :token-id="tokenId" @go-back="slide = 'start-panel'" />
        </q-carousel-slide>
        <q-carousel-slide
          name="start-panel"
          class="column no-wrap flex start-panel"
          style="border: none; border-radius: 0; background-color: #303443"
        >
          <div class="row flex-center" style="padding-top: 10px">
            <div
              class="column flex-center q-pr-xl q-pb-md"
              @click="slide = 'open-content'"
            >
              <div class="row">
                <q-btn
                  flat
                  round
                  color="white"
                  icon="mdi-folder-open"
                  size="xl"
                />
              </div>
              <div class="row text-body1" style="color: white">Öffnen</div>
            </div>

            <div
              class="column flex-center q-pl-xl q-pb-md"
              style="border: 1px solid white; border-width: 0 0 0 1px"
              @click="slide = 'share-content'"
            >
              <div class="row">
                <q-btn
                  flat
                  round
                  color="white"
                  icon="mdi-share-variant"
                  size="xl"
                />
              </div>
              <div class="row text-body1" style="color: white">Teilen</div>
            </div>
          </div>
        </q-carousel-slide>
        <q-carousel-slide name="share-content" class="column no-wrap">
          <share-content @go-back="slide = 'start-panel'" />
        </q-carousel-slide>
      </q-carousel>
    </div>

    <div class="row items-center justify-evenly q-mb-xl" style="color: white">
      <span class="text-body1"> </span>
    </div>

    <q-footer reveal class="q-pa-md text-center">
      Teile Texte, Passwörter, Dateien und mehr.<br />Schnell, einfach, sicher.
    </q-footer>
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
  props: {
    tokenId: String,
  },

  data () {
    return {
      backgroundColor: this.tokenId ? "fff" : "#303443",
      slide: this.tokenId ? "open-content" : "start-panel",
      lorem:
        "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Itaque voluptatem totam, architecto cupiditate officia rerum, error dignissimos praesentium libero ab nemo provident incidunt ducimus iusto perferendis porro earum. Totam, numquam?"
    };
  },

  watch: {
    slide () {
      if (this.slide === "start-panel") {
        this.backgroundColor = "#303443";
      } else {
        this.backgroundColor = "#fff";
      }
    }
  }
});
</script>
