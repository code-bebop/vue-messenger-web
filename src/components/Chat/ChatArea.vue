<template>
  <div class="chat-textarea" ref="chatTextarea">
    <ol class="chat-messageList" ref="chatMessageList">
      <li
        v-for="(message, index) in chatAreaProps.messages"
        :key="index"
        :class="[
          message.type === 'chat' ? 'chat-message' : 'system-message',
          message.userId === userId ? 'my-chat-message' : '',
        ]"
      >
        <p
          v-if="message.type === 'chat' && message.username !== props.username"
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
      <li v-if="props.disconnected.is" class="system-message">
        {{
          props.disconnected.reason === "transport close"
            ? "서버가 종료되었습니다."
            : "채팅방을 나갔습니다."
        }}
      </li>
    </ol>
    <transition name="fade">
      <button
        v-if="chatAreaProps.newMessage"
        @click="(chatAreaProps.newMessage = false), showNewMessage()"
        class="chat-textarea__newMessageButton"
      >
        새 메시지
      </button>
    </transition>
  </div>
</template>

<script>
import {
  computed,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  Transition,
  watch,
} from "vue";

export default {
  components: { Transition },
  props: {
    username: String,
    disconnected: {
      is: Boolean,
      reason: String,
    },
  },
  setup(props) {
    const app = getCurrentInstance();
    const $socket = computed(
      () => app.appContext.config.globalProperties.$socket
    ).value;

    const chatTextarea = ref(null);
    const chatMessageList = ref(null);

    const userId = computed(() => $socket.id);

    const chatAreaProps = reactive({
      messages: [],
      newMessage: false,
    });

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
      chatTextarea.value.scrollTo({
        top: chatTextarea.value.scrollHeight,
      });
    }

    watch(
      () => chatAreaProps.messages.length,
      () => {
        if (isSeenNewMessage()) {
          chatTextarea.value.scrollTo({
            top: chatTextarea.value.scrollHeight,
          });
        }
      },
      { flush: "post" }
    );

    onMounted(() => {
      $socket.on("joinUser", ({ username, order }) => {
        chatAreaProps.messages.push({ username, order, type: "welcome" });
      });
      $socket.on("exitUser", ({ username, order }) => {
        chatAreaProps.messages.push({ username, order, type: "goodbye" });
      });
      $socket.on("chat", ({ username, message, order, chattedUserId }) => {
        chatAreaProps.messages.push({
          username,
          messageText: message,
          order,
          userId: chattedUserId,
          type: "chat",
        });

        console.log(chattedUserId);
        console.log(userId.value);

        if (!isSeenNewMessage() && chattedUserId !== userId.value) {
          chatAreaProps.newMessage = true;
        }
        if (chattedUserId === userId.value) {
          showNewMessage();
        }
      });
    });

    return {
      props,
      chatAreaProps,
      chatTextarea,
      chatMessageList,
      showNewMessage,
      userId,
    };
  },
};
</script>

<style lang="scss" scoped>
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
    &.fade-enter-active,
    &.fade-leave-active {
      transition: all 0.35s ease;
    }

    &.fade-enter-from,
    &.fade-leave-to {
      opacity: 0;
      transform: translateY(50px);
    }
  }
}
</style>
