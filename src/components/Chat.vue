<template>
  <div class="chat-main">
    <textarea
      class="chat-textarea"
      ref="chatTextarea"
      v-model="state.textarea"
      disabled
    ></textarea>
    <ol class="chat-list">
      <li class="user-count">{{ state.userCount }}명 접속중</li>
      <li v-for="user in state.userList" :key="user.id">
        {{ user.username }}(Guest{{ user.order }})
      </li>
    </ol>
  </div>

  <form id="chat-form" @submit.prevent="chatSubmit">
    <input
      type="text"
      id="chat-form-input"
      autocomplete="off"
      v-model="state.message"
    />
    <button>전송</button>
  </form>
</template>

<script>
import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "@vue/runtime-core";
import { useRoute } from "vue-router";

export default {
  name: "Chat",
  setup() {
    const app = getCurrentInstance();
    const $socket = app.appContext.config.globalProperties.$socket;

    const route = useRoute();
    const username = computed(() => route.params.username);

    const chatTextarea = ref(null);
    const state = reactive({
      message: "",
      textarea: "",
      userCount: 0,
      userList: [],
      userId: "",
    });

    function chatSubmit() {
      if (state.message === "") return;

      $socket.emit("chat", {
        message: state.message,
        userId: state.userId,
      });
      state.message = "";
    }

    watch(
      () => state.textarea,
      () => {
        chatTextarea.value.scrollTop = chatTextarea.value.scrollHeight;
      }
    );

    onMounted(() => {
      $socket.emit("joinUser", username.value);
      $socket.emit("getCount");

      $socket.on("connect", () => {
        state.userId = $socket.id;
      });
      $socket.on("joinUser", ({ username, order }) => {
        state.textarea +=
          `${username}(Guest${order}) 님이 접속했습니다.` + "\n";
      });
      $socket.on("exitUser", ({ username, order }) => {
        state.textarea +=
          `${username}(Guest${order}) 님이 접속을 해제했습니다.` + "\n";
      });
      $socket.on("userListUpdate", (userList) => {
        state.userList = userList.slice();
      });
      $socket.on("count", (count) => {
        state.userCount = count;
      });
      $socket.on("chat", ({ username, message, order }) => {
        state.textarea += `${username}(Guest${order}): ${message}` + "\n";
      });
    });

    onUnmounted(() => {
      $socket.disconnect();
    });

    return {
      state,
      chatSubmit,
      username,
      chatTextarea,
    };
  },
};
</script>

<style lang="scss" scoped>
.chat-main {
  display: grid;
  grid-template-columns: 4fr 1fr;
  .chat-textarea {
    background: #fff;
    border: 1px solid #000;
    max-width: 80vw;
    min-width: 80vw;
    height: 80vh;
    resize: none;
  }
  .chat-list {
    list-style: none;
    text-align: left;
    border: 1px solid #000;
    padding-top: 60px;
    margin: 0;
    .user-count {
      margin-bottom: 1em;
      font-size: 1.4em;
    }
  }
}
</style>
