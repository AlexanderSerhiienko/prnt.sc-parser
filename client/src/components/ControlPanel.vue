<template>
  <div>
    <span>
      <h1 class="align-center">prnt.sc parser</h1>
      <p>Enter the amount of photos</p>
      <input type="text" v-model="text" @keypress.enter="onSubmit" />
      <button :disabled="loading" type="submit" @click="onSubmit">X</button>
      <!-- <input type="checkbox" @change="$emit('scroll-switch')"> -->
      <Loading v-if="loading" />
    </span>
  </div>
</template>
<script>
import Loading from './Loading.vue'

export default {
  data() {
    return {
      text: "",
    };
  },
  components: {
    Loading
  },
  props: ["pictures", 'loading'],
  methods: {
    onSubmit() {
      if (this.loading) return
      this.$emit("start-parsing", parseInt(this.text));
      this.text = "";
    },
  },
};
</script>
<style scoped>
input {
  height: 30px;
}
button {
  background-color:rgb(51, 255, 0);
  height: 35px;
   width: 35px;
}
p{
  margin-bottom: 0;
}
</style>
