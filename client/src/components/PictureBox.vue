<template>
  <div id="pic-box" class="picture-box">
    <transition-group enter-active-class="animate__animated animate__fadeInUp">
      <Picture v-for="(picture, i) in pictures" :key="i" :picture="picture" />
    </transition-group>
    <div id="scroll-bottom"></div>
  </div>
</template>
<script>
import Picture from '@/components/Picture'
export default {
  components: {
    Picture
  },
  computed: {
    pictures() {
      return this.$store.getters.pictures
    }
  }
}
</script>
<style scoped>
.picture-box {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 457px);
  flex-wrap: wrap;
  justify-items: center;
  padding-bottom: 260px;
}

</style>
