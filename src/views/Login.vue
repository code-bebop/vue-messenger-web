<template>
  <div class="login-page">
    <form class="login-form" @submit.prevent="joinSubmit">
      <div class="login-form__inner">
        <input
          id="login-input"
          type="text"
          v-model="state.username"
          placeholder="닉네임"
          autocomplete="off"
        />
        <label for="login-input">닉네임</label>
      </div>

      <button>입장</button>
    </form>
  </div>
</template>

<script>
import { getCurrentInstance, reactive } from "@vue/runtime-core";

export default {
  name: "Login",
  setup() {
    const app = getCurrentInstance();
    const $router = app.appContext.config.globalProperties.$router;

    const state = reactive({ username: "" });

    function joinSubmit() {
      $router.push({ name: "ChatRoom", params: { username: state.username } });
    }

    return {
      state,
      joinSubmit,
    };
  },
};
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.login-form {
  display: flex;
  flex-direction: column;
  &__inner {
    position: relative;
    #login-input {
      border: none;
      border-bottom: 2px solid #000;
      outline: none;
      line-height: 2em;
      padding: 20px 0 5px 0;
      font-size: 1.2em;
      transition: all 0.2s ease;
      -webkit-transition: all 0.2s ease;
      -moz-transition: all 0.2s ease;
      -o-transition: all 0.2s ease;
      &:focus,
      &:not(:placeholder-shown) {
        border-bottom-color: hotpink;
      }
      &::placeholder {
        color: transparent;
      }
      &:placeholder-shown + label {
        color: #aaa;
        font-size: 14px;
        top: 15px;
      }
    }
  }
  #login-input:focus + label,
  label {
    color: hotpink;
    font-size: 10pt;
    pointer-events: none;
    position: absolute;
    left: 0px;
    top: 0px;
    transition: all 0.2s ease;
    -webkit-transition: all 0.2s ease;
    -moz-transition: all 0.2s ease;
    -o-transition: all 0.2s ease;
  }
  button {
    display: block;
    margin-top: 1.5em;
    border: none;
    background-color: hotpink;
    height: 4rem;
    font-size: 1.3rem;
    font-weight: bold;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-transition: all 0.2s ease;
    -moz-transition: all 0.2s ease;
    -o-transition: all 0.2s ease;
    &:hover {
      background-color: crimson;
    }
  }
}
</style>
