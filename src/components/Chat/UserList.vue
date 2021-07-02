<template>
  <button class="toggleButton" @click="toggleUserList">
    {{ state.showUserList ? `&lt;` : `>` }}
  </button>
  <ol class="userList" :class="[state.showUserList ? '' : 'fold']">
    <li class="user-count">{{ props.userCount }}명 접속중</li>
    <li v-for="user in props.userList" :key="user.id" class="userList__item">
      {{ user.username }}(Guest{{ user.order }})
    </li>
  </ol>
</template>

<script>
import { reactive } from "@vue/reactivity";

export default {
  props: { userList: Array, userCount: Number },
  setup(props) {
    const state = reactive({
      userCount: 0,
      showUserList: true,
    });

    function toggleUserList() {
      state.showUserList = !state.showUserList;
    }
    return {
      state,
      toggleUserList,
      props,
    };
  },
};
</script>

<style lang="scss" scoped>
.userList {
  list-style: none;
  text-align: left;
  border-right: 1px solid #dcdcdc;
  padding: 0;
  margin: 0;
  grid-row: 1 / 3;
  box-sizing: border-box;
  overflow-y: auto;
  width: 275px;
  &__item {
    padding: 5px;
    padding-left: 40px;
  }
  .user-count {
    margin: 3em 0;
    font-size: 1.4em;
    text-align: center;
  }
  &.fold {
    width: 0;
    transform: translateX(-100%);
    & > li {
      display: none;
    }
  }
}
.toggleButton {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
  font-weight: bold;
  font-size: 2em;
  color: white;
  background-color: #dcdcdc;
  border-radius: 5px;
  width: 40px;
  height: 40px;
  opacity: 0.5;
  z-index: 1;
  &:hover {
    opacity: 1;
    background-color: hotpink;
  }
  &:active {
    background-color: #ff2f97;
  }
}
</style>
