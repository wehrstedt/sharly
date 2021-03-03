<template>
  <div>
    <q-dialog v-model="uploadDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t("period_of_validity") }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ $t("period_of_validity_expl") }}
        </q-card-section>

        <q-card-section class="q-pt-none">
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <div class="row">
              <q-select
                borderless
                v-model="selectedTime"
                :options="minutes"
                class="col-4 q-pr-md"
              />
              <q-select
                borderless
                v-model="selectedTimeUnit"
                :options="timeUnits"
                class="col-8"
              />
            </div>
          </transition>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('abort_upper')" icon="mdi-close" v-close-popup />
          <q-btn
            flat
            icon-right="mdi-cloud-upload"
            :label="$t('share_upper')"
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
          <div class="text-h6">{{ $t('confirmation_upper') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row full-width">
            {{ $t('token_created_submit_text') }}:
          </div>

          <div class="row full-width justify-evenly">
            <vue-qrcode :value="tokenLink" v-if="tokenLink" />
            <span class="q-pt-md text-body1 text-weight-medium">{{ tokenId }}</span>
            <q-btn
              flat
              icon="mdi-clipboard-multiple-outline"
              class="float-right q-pt-sm"
              @click="copyTokenToClipboard"
              style="width: 40px; height: 40px"
            />
            <q-btn
              flat
              icon="mdi-share-variant"
              class="float-right q-pt-sm"
              @click="shareViaWebShare"
              style="width: 40px; height: 40px; margin-left: -20px"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-pt-sm">
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat :label="$t('close_upper')" v-close-popup />
          <!-- <q-btn
            flat
            icon-right="mdi-qrcode"
            label="QR-Code"
            @click="upload"
          /> -->
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showPopupBottomNotification" position="bottom">
      <q-card style="width: 350px">
        <q-card-section class="row items-center no-wrap">
          <q-icon :name="popupBottomNotificationIcon" />
          <span class="text-weight-bold q-ml-sm">{{
            popupBottomNotificationText
          }}</span>
        </q-card-section>
      </q-card>
    </q-dialog>

    <div class="q-mt-md text-center">
      <q-btn
        flat
        icon="mdi-arrow-left"
        size="sm"
        style="position: absolute; left: 0"
        @click="goback"
      />
      <div class="text-h6">{{ $t('header_share_content') }}</div>
      <div class="text-body2" v-if="authorized || authorizationCheckActive">
        {{ $t('subheader_share_content') }}
      </div>
      <div
        class="text-body2"
        style="text-align: left"
        v-if="!authorized && !authorizationCheckActive"
      >
        {{ $t('enforce_authorization_msg') }}:
      </div>

      <div
        class="row q-mt-md flex-center"
        v-if="authorized || authorizationCheckActive"
      >
        <div class="column full-width">
          <q-input
            ref="sharedText"
            v-model="sharedText"
            outlined
            autogrow
            :label="$t('enter_text') + '...'"
            @focus="$emit('input-focus')"
            @blur="$emit('input-blur')"
          />
        </div>

        <div class="column full-width q-pt-md">
          <q-form
            @submit="uploadFiles"
            ref="fileUploadForm"
            :action="backendURL + '/upload'"
            method="POST"
          >
            <q-file
              name="files"
              ref="files"
              for="files"
              v-model="filesToUpload"
              :label="$t('label_attachments')"
              outlined
              counter
              multiple
              append
              clearable
            />
          </q-form>
        </div>
      </div>

      <div
        class="row q-mt-md flex-center"
        v-if="!authorized && !authorizationCheckActive"
      >
        <div class="column full-width">
          <q-input
            v-model="password"
            ref="password"
            type="password"
            outlined
            :label="$t('label_password')"
            bottom-slots
            :error="authError"
            @keyup="passwordFieldKeyUp"
            @focus="$emit('input-focus')"
            @blur="$emit('input-blur')"
          >
          </q-input>
        </div>
      </div>

      <q-btn
        flat
        @click="abortWithConfirm"
        class="q-mt-md float-left"
        icon="mdi-close"
        :label="$t('abort_upper')"
      />

      <q-btn
        flat
        class="q-mt-md float-right"
        icon-right="mdi-cloud-upload"
        :label="$t('share_upper')"
        :disable="disableUploadBtn"
        @click="uploadDialog = true"
        v-if="authorized || authorizationCheckActive"
      />

      <q-btn
        flat
        class="q-mt-md float-right"
        icon-right="mdi-login"
        :label="$t('label_submit')"
        :disable="password.length === 0"
        @click="authorize"
        v-if="!authorized && !authorizationCheckActive"
      />

      <q-inner-loading
        :showing="authorizationCheckActive || authorizationActive"
      >
        <q-spinner-dots size="50px" color="primary" />
      </q-inner-loading>
    </div>
  </div>
</template>

<style scoped>
label[for="files"] :first-child {
 min-height: 70px;
}
</style>

<script lang="ts">
import { api as backend, File, backendURL } from "../boot/backend";
import { copyToClipboard } from "quasar";
import * as moment from "moment";
import VueQrcode from "vue-qrcode";

import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "ShareContent",
  components: { VueQrcode },

  methods: {
    abort () {
      this.openFileUpload = this.openTextUpload = false;
      this.sharedText = "";
      this.disableUploadBtn = true;
      this.filesToUpload = [];
      this.$emit("input-blur");
      this.goback();
    },

    abortWithConfirm () {
      if (
        (!this.filesToUpload || this.filesToUpload.length === 0) &&
        this.sharedText.length === 0
      ) {
        this.abort();
      } else {
        this.$q
          .dialog({
            title: this.$t("confirmation_upper").toString(),
            message: this.$t("submit_abort").toString(),
            ok: this.$t("yes_upper"),
            cancel: this.$t("no_upper")
          })
          .onOk(this.abort.bind(this));
      }
    },

    authorize () {
      this.authorizationActive = true;
      backend
        .auth(this.password)
        .then((token) => {
          this.authorizationActive = false;
          this.authorized = true;
          this.authToken = token;

          setTimeout(() => {
            // @ts-ignore
            this.$refs.sharedText.$el.focus();
          }, 20);
        })
        .catch((err) => {
          this.authorizationActive = false;
          let msg: string = err instanceof Error ? err.message : err.toString();
          if (msg.match(/401/)) {
            msg = this.$t("invalid_password").toString();
          }

          this.authError = true;
          this.popupBottomNotificationText = msg;
          this.popupBottomNotificationIcon = "mdi-close";
          this.showPopupBottomNotification = true;
          setTimeout(() => {
            this.showPopupBottomNotification = false;
          }, 2000);
        });
    },

    createToken (files?: File[]): void {
      backend
        .createToken(this.getValidUntilTimestamp(), this.sharedText, files)
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
        .catch((err) => {
          let errMsg = err.toString();
          if (err.response) {
            errMsg = `${err.response.status}: ${err.response.statusText}`;
          }

          this.loading = false;
          alert(`Fehler: ${errMsg}`);
        });
    },

    copyTokenToClipboard () {
      copyToClipboard(this.tokenId).then(() => {
        this.popupBottomNotificationText = `${this.$t("token_copied_msg")}!`;
        this.popupBottomNotificationIcon = "mdi-check";
        this.showPopupBottomNotification = true;
        setTimeout(() => {
          this.showPopupBottomNotification = false;
        }, 2000);
      });
    },

    getValidUntilTimestamp (): number {
      // @ts-ignore
      const validUntil = moment()
        .add(this.selectedTime.value, this.selectedTimeUnit.value)
        .toDate();
      return validUntil.getTime();
    },

    goback () {
      this.$emit("go-back");
    },

    openFile () {
      this.openFileUpload = true;
    },

    openText () {
      this.openTextUpload = true;
      setTimeout(() => {
        // @ts-ignore
        this.$refs.sharedText.$el.focus();
      }, 20);
    },

    passwordFieldKeyUp (e: KeyboardEvent) {
      if (e.keyCode === 13) {
        this.$emit("input-blur");
        this.authorize();
      }
    },

    sharedFinished () {
      this.openFileUpload = this.openTextUpload = false;
      this.disableUploadBtn = true;
      this.sharedText = "";
      this.$emit("go-back");
    },

    shareViaWebShare () {
      if (navigator.share) {
        navigator.share({
          title: this.$t("webshare_title").toString(),
          text: this.$t("webshare_text").toString(),
          url: this.tokenLink
        });
      } else {
        copyToClipboard(this.tokenLink).then(() => {
          this.popupBottomNotificationText = `${this.$t("link_copied")}!`;
          this.popupBottomNotificationIcon = "mdi-close";
          this.showPopupBottomNotification = true;
          setTimeout(() => {
            this.showPopupBottomNotification = false;
          }, 2000);
        });
      }
    },

    upload () {
      this.loading = true;
      this.uploadStartTime = Date.now();

      if (!this.filesToUpload || this.filesToUpload.length === 0) {
        this.createToken();
      } else {
        const fileUploadForm = this.$refs.fileUploadForm;
        // @ts-ignore
        fileUploadForm.submit();
      }
    },

    uploadFiles () {
      // @ts-ignore
      const formData = new FormData(this.$refs.fileUploadForm.$el);
      backend
        .uploadFiles(formData)
        .then(this.createToken.bind(this))
        .catch((err) => {
          let errMsg = err.toString();
          if (err.response) {
            errMsg = `${err.response.status}: ${err.response.statusText}`;
          }

          this.loading = false;
          alert(`${this.$t("error_upper")}: ${errMsg}`);
        });
    },

    uploadFinished (tokenId: string) {
      this.tokenId = tokenId;
      this.loading = false;
      this.uploadStartTime = 0;
      this.uploadDialog = false;
      this.uploadFinishedDialog = true;
    }
  },

  data () {
    const minutes = [];
    for (var i = 1; i <= 60; i++) {
      minutes.push({
        label: i.toString(),
        value: i
      });
    }

    const timeUnits = [
      // @ts-ignore
      { label: this.$t("minutes_upper"), value: "minutes" },
      // @ts-ignore
      { label: this.$t("hours_upper"), value: "hours" },
      // @ts-ignore
      { label: this.$t("days_upper"), value: "days" }
    ];

    const authToken = localStorage.getItem("jwt");
    return {
      backendURL,
      authToken,
      authorized: false,
      authorizationCheckActive: authToken !== null,
      authorizationActive: false,
      authError: false,
      authHint: "",
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
      tokenLink: "",
      showPopupBottomNotification: false,
      popupBottomNotificationText: "",
      popupBottomNotificationIcon: "",
      triggerFileUpload: false,
      filesToUpload: null,
      password: ""
    };
  },

  watch: {
    openFileUpload () {
      this.selected = this.openFileUpload;
    },

    openTextUpload () {
      this.selected = this.openTextUpload;
    },

    sharedText () {
      this.disableUploadBtn =
        this.sharedText.length === 0 && (!this.filesToUpload || this.filesToUpload.length === 0);
    },

    filesToUpload () {
      this.disableUploadBtn = (!this.filesToUpload || this.filesToUpload.length === 0) && this.sharedText.length === 0
    },

    tokenId () {
      if (this.tokenId) {
        this.tokenLink = `${window.location.protocol}//${window.location.host}/#/token/${this.tokenId}`;
      } else {
        this.tokenLink = "";
      }
    }
  },

  mounted () {
    if (this.authToken) {
      this.authorizationCheckActive = true;
      backend
        .isAuthorized()
        .then((result) => {
          this.authorized = result;
          if (this.authorized) {
            setTimeout(() => {
              // @ts-ignore
              this.$refs.sharedText.$el.focus();
            }, 20);
          } else {
            localStorage.removeItem("jwt");
            this.authToken = null;
            setTimeout(() => {
              // @ts-ignore
              this.$refs.password.$el.focus();
            }, 20);
          }
        })
        .finally(() => (this.authorizationCheckActive = false));
    } else {
      setTimeout(() => {
        // @ts-ignore
        this.$refs.password.$el.focus();
      }, 20);
    }
  }
});
</script>
