<template>
  <div class="chat-main">
    <ol class="chat-userList">
      <li class="user-count">{{ state.userCount }}명 접속중</li>
      <li v-for="user in state.userList" :key="user.id">
        {{ user.username }}(Guest{{ user.order }})
      </li>
    </ol>
    <div class="chat-textarea" ref="chatTextarea">
      <ol class="chat-messageList" ref="chatMessageList">
        <li v-for="(message, index) in state.messages" :key="index">
          {{ message.username }}(Guest{{ message.order }}):
          {{ message.messageText }}
        </li>
      </ol>
    </div>

    <form id="chat-form" @submit.prevent="chatSubmit">
      <input
        type="text"
        id="chat-form-input"
        autocomplete="off"
        placeholder="여기에 텍스트 입력"
        v-model="state.inputMessage"
      />
    </form>
  </div>
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
    const chatMessageList = ref(null);

    const state = reactive({
      inputMessage: "",
      messages: [],
      userCount: 0,
      userList: [],
      userId: "",
    });

    watch(
      () => state.messages.length,
      () => {
        chatTextarea.value.scrollTop = chatTextarea.value.scrollHeight;
      }
    );

    function chatSubmit() {
      if (state.inputMessage === "") return;

      $socket.emit("chat", {
        message: state.inputMessage,
        userId: state.userId,
      });
      state.inputMessage = "";
    }

    onMounted(() => {
      $socket.emit("joinUser", username.value);
      $socket.emit("getCount");
      console.log(chatMessageList);

      $socket.on("connect", () => {
        state.userId = $socket.id;
      });
      $socket.on("joinUser", ({ username, order }) => {
        const f = document.createDocumentFragment();
        const joinUserLi = document.createElement("li");
        joinUserLi.innerHTML = `${username}(Guest${order}) 님이 접속했습니다.`;
        f.appendChild(joinUserLi);
        chatMessageList.value.appendChild(f);
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
        state.messages.push({ username, messageText: message, order });
      });
    });

    onUnmounted(() => {
      $socket.disconnect();
    });

    return {
      state,
      chatSubmit,
      username,
      chatMessageList,
      chatTextarea,
    };
  },
};
</script>

<style lang="scss" scoped>
.chat-main {
  display: grid;
  grid-template-columns: 4fr 1fr;
  grid-template-rows: 90vh 10vh;
  width: 100vw;
  height: 100vh;
  .chat-textarea {
    background: #fdfdfd;
    border: 1px solid #ccc;
    border-left: none;
    max-width: 80vw;
    min-width: 80vw;
    height: 90vh;
    resize: none;
    margin: 0;
    box-sizing: border-box;
    overflow-y: auto;
    .chat-messageList {
      list-style: none;
      margin: 2em 0;
    }
  }
  .chat-userList {
    list-style: none;
    text-align: left;
    border: 1px solid #ccc;
    padding-top: 60px;
    margin: 0;
    grid-row: 1 / 3;
    box-sizing: border-box;
    .user-count {
      margin-bottom: 1em;
      font-size: 1.4em;
    }
  }
  #chat-form-input {
    width: 100%;
    height: 100%;
    margin: 0;
    box-sizing: border-box;
    border: none;
    outline: none;
    font-size: 18px;
    padding-left: 50px;
    &:focus {
      &::placeholder {
        color: transparent;
      }
    }
  }
}
</style>
