<template>
  <div>
    <q-dialog v-model="uploadDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Gültigkeitsdauer</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Wähle aus, wie lange der Inhalt abgerufen werden kann. Nach Ablauf der eingestellten Gültigkeitsdauer wird dein geteilter Inhalt vom Server gelöscht.
        </q-card-section>

        <q-card-section class="q-pt-none">
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <div class="row">
              <q-select borderless v-model="selectedTime" :options="minutes" class="col-4 q-pr-md" />
              <q-select borderless v-model="selectedTimeUnit" :options="timeUnits" class="col-8" />
            </div>
          </transition>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Abbrechen" icon="mdi-close" v-close-popup />
          <q-btn
            flat
            icon-right="mdi-cloud-upload"
            label="Teilen"
            @click="upload"
          />
        </q-card-actions>

        <q-inner-loading :showing="loading">
          <q-spinner-dots size="50px" color="primary" />
        </q-inner-loading>
      </q-card>
    </q-dialog>

    <q-dialog v-model="uploadFinishedDialog" @hide="sharedFinished">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Bestätigung</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Der Inhalt wurde geteilt. Du kannst mit dem folgenden Token auf den Inhalt zugreifen:
          <div class="q-pt-md">
            <span class="text-body1">
              {{ tokenId }}
            </span>
            <q-btn flat icon="mdi-clipboard-multiple-outline" class="float-right" @click="copyTokenToClipboard" />
            <q-btn flat icon="mdi-share-variant" class="float-right" @click="shareViaWebShare" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Schließen" v-close-popup />
          <!-- <q-btn
            flat
            icon-right="mdi-qrcode"
            label="QR-Code"
            @click="upload"
          /> -->
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="confirmCopyToClipboard" position="bottom">
      <q-card style="width: 350px">
        <q-card-section class="row items-center no-wrap">
            <q-icon name="mdi-check" />
            <span class="text-weight-bold q-ml-sm">{{ confirmCopyToClipboardText }}</span>
        </q-card-section>
      </q-card>
    </q-dialog>

    <div class="q-mt-md text-center">
      <q-btn flat icon="mdi-arrow-left" size="sm" style="position: absolute; left: 0" @click="goback" />
      <div class="text-h6">Inhalt teilen</div>
      <div class="text-body2">Was möchtest du teilen?</div>

      <div :class="'row q-mt-' + containerMargin + ' flex-center'">
        <div class="column" v-show="!selected" @click="openFile">
          <q-icon name="mdi-file" size="lg"/>
          <div class="text-body3 q-mt-xs">Datei</div>
        </div>

        <div class="column full-width" v-show="openFileUpload">
              <q-form @submit="uploadFiles" ref="fileUploadForm" action="/backend/upload" method="POST">
                <q-file
                  name="files"
                  v-model="filesToUpload"
                  label="Datei(en) auswählen"
                  filled
                  counter
                  multiple
                  append
                  clearable
                  @input="filesSelected"
                />
              </q-form>
        </div>

        <div class="column full-width" v-show="openTextUpload">
          <q-input
            ref="sharedText"
            v-model="sharedText"
            outlined
            autogrow
            label="Text eingeben..."
            :rules="[val => !!val || 'Bitte gib einen Text ein.']"
          />
        </div>

        <div class="column q-ml-xl" v-show="!selected" @click="openText">
          <q-icon name="mdi-text-box" size="lg"/>
          <div class="text-body3 q-mt-xs">Text</div>
        </div>
      </div>

      <q-btn
        flat
        v-if="selected"
        @click="openFileUpload = openTextUpload = false; sharedText = ''; disableUploadBtn = true;"
        class="q-mt-md float-left"
        icon="mdi-close"
        label="Abbrechen"
      />

      <q-btn
        flat
        v-if="selected"
        class="q-mt-md float-right"
        icon-right="mdi-cloud-upload"
        label="Teilen"
        :disable="disableUploadBtn"
        @click="uploadDialog=true"
      />
    </div>
  </div>
</template>

<script lang="ts">
import FileUploader from "./FileUploader.vue";
import { api as backend } from "../boot/backend";
import { copyToClipboard } from "quasar";
import * as moment from "moment";

import {
  defineComponent
} from "@vue/composition-api";

export default defineComponent({
  name: "ShareContent",
  components: { FileUploader },

  methods: {
    copyTokenToClipboard () {
      copyToClipboard(this.tokenId).then(() => {
        this.confirmCopyToClipboardText = "Token kopiert!";
        this.confirmCopyToClipboard = true;
        setTimeout(() => {
          this.confirmCopyToClipboard = false;
        }, 2000);
      });
    },

    getValidUntilTimestamp() {
      const validUntil = moment().add(this.selectedTime.value, this.selectedTimeUnit.value).toDate();
      return validUntil.getTime();
    },

    goback () {
      this.$emit("go-back");
    },

    filesSelected(files) {
      if (files) {
        this.disableUploadBtn = false;
      } else {
        this.disableUploadBtn = true;
      }
    },

    openFile () {
      this.openFileUpload = true;
    },

    openText () {
      this.openTextUpload = true;
      setTimeout(() => {
        this.$refs.sharedText.$el.focus();
      }, 20);
    },

    sharedFinished() {
      this.openFileUpload = this.openTextUpload = false;
      this.disableUploadBtn = true;
      this.sharedText = ''; 
      this.$emit("go-back");
    },

    shareViaWebShare() {
      const url = `${window.location.protocol}//${window.location.host}/token/${this.tokenId}`;
      if (navigator.share) {
        navigator.share({
          title: 'Jemand möchte was mit dir Teilen',
          text: `Hallo. Jemand möchte mit dir etwas via Sharly teilen. Öffne diesen Link, um den Inhalt zu sehen: ${url}`,
          url
        });
      } else {
        copyToClipboard(url).then(() => {
          this.confirmCopyToClipboardText = "Link kopiert!";
          this.confirmCopyToClipboard = true;
          setTimeout(() => {
            this.confirmCopyToClipboard = false;
          }, 2000);
        });
      }
    },

    upload () {
      this.loading = true;
      this.uploadStartTime = Date.now();

      if (this.openTextUpload) {
        backend.createTextToken(this.sharedText, this.getValidUntilTimestamp())
          .then((tokenId: string) => {
            const uploadTime = Date.now() - this.uploadStartTime;
            const minShowThrobber = 1000;
            if (uploadTime < minShowThrobber) {
              setTimeout(() => {
                this.uploadFinished(tokenId);
              }, minShowThrobber - uploadTime);
            } else {
              this.uploadFinished(tokenId);
            }
          })
          .catch((err: string) => alert(`Fehler: ${err}`));
      } else {
        const fileUploadForm = this.$refs.fileUploadForm;
        fileUploadForm.submit();
      }
    },

    uploadFiles(evt) {
      const formData = new FormData(this.$refs.fileUploadForm.$el)
      backend.uploadFiles(formData).then((uploadedFiles: any[]) => {
        backend.createFileToken(uploadedFiles, this.getValidUntilTimestamp())
          .then((tokenId: string) => {
            const uploadTime = Date.now() - this.uploadStartTime;
            const minShowThrobber = 1500;
            if (uploadTime < minShowThrobber) {
              setTimeout(() => {
                this.uploadFinished(tokenId);
              }, minShowThrobber - uploadTime);
            } else {
              this.uploadFinished(tokenId);
            }
          })
          .catch((err: string) => alert(`Fehler: ${err}`));
      }).catch((err) =>{
        alert(`File upload failed: ${err}`);
      })
    },

    uploadFinished (tokenId: string) {
      this.tokenId = tokenId;
      this.loading = false;
      this.uploadStartTime = 0;
      this.uploadDialog = false;
      this.uploadFinishedDialog = true;
    }
  },

  setup () {
    const minutes = [];
    for (var i = 1; i <= 60; i++) {
      minutes.push({
        label: i.toString(),
        value: i,
      });
    }

    const timeUnits = [
      { label: "Minuten", value: "minutes"},
      { label: "Stunden", value: "hours"},
      { label: "Tage", value: "days"},
    ];

    return {
      containerMargin: "xl",
      selected: false,
      openFileUpload: false,
      openTextUpload: false,
      uploadDialog: false,
      sharedText: "",
      selectedTime: minutes[4],
      selectedTimeUnit: timeUnits[0],
      timeUnits,
      minutes,
      disableUploadBtn: true,
      loading: false,
      uploadStartTime: 0,
      uploadFinishedDialog: false,
      tokenId: "",
      confirmCopyToClipboard: false,
      confirmCopyToClipboardText: "",
      triggerFileUpload: false,
      filesToUpload: null
    };
  },

  watch: {
    selected () {
      if (this.selected) {
        this.containerMargin = "md";
      } else {
        this.containerMargin = "xl";
      }
    },

    openFileUpload () {
      this.selected = this.openFileUpload;
    },

    openTextUpload () {
      this.selected = this.openTextUpload;
    },

    sharedText () {
      this.disableUploadBtn = this.sharedText.length === 0;
    }
  }
});
</script>
