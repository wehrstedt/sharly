<template>
  <div>
    <q-card class="my-card">
      <q-card-section>
        <div class="text-h6">Inhalt teilen</div>
      </q-card-section>

      <q-card-section>
        ...oder teile stattdessen jetzt einen Text oder eine Datei.
        <q-btn color="black" class="full-width" label="Inhalt teilen" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import {
  defineComponent
} from "@vue/composition-api";

export default defineComponent({
  name: "CreateNewToken",
  setup () {
    return {
      token: ""
    };
  }
});
</script>
