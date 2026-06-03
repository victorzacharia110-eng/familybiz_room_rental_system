<script setup>
</script>

<template>
<!-- FOOTER -->
<footer class="footer">
  <div class="footer-container">
    <div>
      <h3>{{ $t('homeFooterTitle') }}</h3>
      <p>{{ $t('homeFooterDescription') }}</p>
    </div>

    <div>
      <h3>{{ $t('homeContact') }}</h3>
      <p><strong>Software Engineer Victor</strong></p>
      <p>📞 0683 870 268</p>
      <p>📞 0794 770 268</p>
    </div>

    <div>
      <h3>{{ $t('homeAddress') }}</h3>
      <p>Gongo la Mboto</p>
      <p>Majohe Bwera</p>
      <p>Dar es Salaam, Tanzania</p>
    </div>
  </div>

  <div class="footer-bottom">
    © {{ new Date().getFullYear() }} Majohe Bwera Rooms
  </div>
</footer>
</template>

<style scoped>
.footer {
  padding: 20px;
  color: #333;
  font-size: 14px;
}

.footer-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-container h3 {
  margin-bottom: 8px;
  font-size: 16px;
  color: #141;
}

.footer-container p {
  margin: 4px 0;
    color: #121;
}

.footer-bottom {
  margin-top: 15px;
  text-align: center;
  font-size: 13px;
  color: #666;
}
</style>