<template>
  <div class="chat-main">
    <UserList :userList="state.userList" :userCount="state.userCount" />
    <div class="chat-textarea" ref="chatTextarea">
      <ol class="chat-messageList" ref="chatMessageList">
        <li
          v-for="(message, index) in state.messages"
          :key="index"
          :class="[
            message.type === 'chat' ? 'chat-message' : 'system-message',
            message.userId === userId ? 'my-chat-message' : '',
          ]"
        >
          <p
            v-if="message.type === 'chat' && message.username !== username"
            class="chat-message__username"
          >
            {{ `${message.username}(Guest${message.order})` }}
          </p>
          {{
            message.type === "chat"
              ? `${message.messageText}`
              : message.type === "welcome"
              ? `${message.username}(Guest${message.order})님이 입장하셨습니다.`
              : `${message.username}(Guest${message.order})님이 퇴장하셨습니다.`
          }}
        </li>
        <li v-if="state.disconnected.is" class="system-message">
          {{
            state.disconnected.reason === "transport close"
              ? "서버가 종료되었습니다."
              : "채팅방을 나갔습니다."
          }}
        </li>
      </ol>
      <transition name="fade">
        <button
          v-if="state.newMessage"
          @click="(state.newMessage = false), showNewMessage()"
          class="chat-textarea__newMessageButton"
        >
          새 메시지
        </button>
      </transition>
    </div>

    <form id="chat-form" @submit.prevent="chatSubmit">
      <input
        type="text"
        id="chat-form-input"
        autocomplete="off"
        placeholder="여기에 텍스트 입력"
        v-model="state.inputMessage"
        @keyup.enter="showNewMessage"
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
import { Transition } from "vue";
import UserList from "./UserList.vue";

export default {
  name: "Chat",
  components: { Transition, UserList },
  setup() {
    const app = getCurrentInstance();
    const $socket = computed(
      () => app.appContext.config.globalProperties.$socket
    ).value;

    const route = useRoute();
    const username = computed(() => route.params.username);
    const userId = computed(() => $socket.id);

    const chatTextarea = ref(null);
    const chatMessageList = ref(null);

    const state = reactive({
      inputMessage: "",
      userList: [],
      userCount: 0,
      messages: [],
      disconnected: {},
      newMessage: false,
    });

    watch(
      () => state.messages.length,
      () => {
        if (isSeenNewMessage()) {
          chatTextarea.value.scrollTo({
            top: chatTextarea.value.scrollHeight,
          });
        }
      },
      { flush: "post" }
    );

    function chatSubmit() {
      if (state.inputMessage === "") return;

      $socket.emit("chat", {
        message: state.inputMessage,
        userId: $socket.id,
      });
      state.inputMessage = "";
    }

    function isSeenNewMessage() {
      function ifIsntPositiveReturnTrue(number) {
        if (number > 0) {
          return false;
        }
        return true;
      }
      return ifIsntPositiveReturnTrue(
        chatTextarea.value.scrollHeight -
          (chatTextarea.value.scrollTop + chatTextarea.value.offsetHeight + 105)
      );
    }

    function showNewMessage() {
      console.log("showNewMessage");
      chatTextarea.value.scrollTo({
        top: chatTextarea.value.scrollHeight,
      });
    }

    onMounted(() => {
      $socket.emit("joinUser", username.value);
      $socket.emit("getCount");

      $socket.on("connect", () => {
        state.disconnected.is = false;
      });

      $socket.on("joinUser", ({ username, order }) => {
        state.messages.push({ username, order, type: "welcome" });
      });
      $socket.on("exitUser", ({ username, order }) => {
        state.messages.push({ username, order, type: "goodbye" });
      });
      $socket.on("userListUpdate", (userList) => {
        state.userList = userList.slice();
      });
      $socket.on("count", (count) => {
        state.userCount = count;
      });
      $socket.on("chat", ({ username, message, order, chattedUserId }) => {
        state.messages.push({
          username,
          messageText: message,
          order,
          userId: chattedUserId,
          type: "chat",
        });

        if (!isSeenNewMessage() && chattedUserId !== userId.value) {
          state.newMessage = true;
        }
      });
      $socket.on("disconnect", (reason) => {
        state.disconnected = {
          is: true,
          reason,
        };
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
      userId,
      showNewMessage,
    };
  },
};
</script>

<style lang="scss" scoped>
.chat-main {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto minmax(75px, 10vh);
  width: 100vw;
  height: 100vh;
  .chat-textarea {
    background: #fdfdfd;
    border-bottom: 1px solid #ccc;
    resize: none;
    box-sizing: border-box;
    overflow-y: auto;
    .chat-messageList {
      list-style: none;
      margin: 0;
      padding: 4.6em 50px 2em;
      box-sizing: border-box;
      &:after {
        content: "";
        display: block;
        clear: both;
      }
      & > li {
        margin-bottom: 2.6em;
        clear: both;
      }
      .system-message {
        text-align: center;
        font-weight: bold;
      }
      .chat-message {
        float: left;
        border-radius: 5px;
        padding: 20px;
        background-color: #dcdcdc;
        position: relative;
        &.my-chat-message {
          float: right;
          background-color: #fdfdfd;
          border: 1px solid hotpink;
        }
        &__username {
          width: 200px;
          position: absolute;
          top: -3em;
          left: 0;
          font-size: 0.9em;
          font-weight: bold;
        }
      }
    }
    &__newMessageButton {
      position: absolute;
      bottom: 17vh;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.2rem;
      padding: 1em;
      background-color: hotpink;
      outline: none;
      border: none;
      color: #fdfdfd;
      border-radius: 10px;
      cursor: pointer;
      &:hover {
        background-color: #ff8ec7;
      }
      &:active {
        background-color: #ff2f97;
      }
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
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.35s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(50px);
  }
}
</style>
