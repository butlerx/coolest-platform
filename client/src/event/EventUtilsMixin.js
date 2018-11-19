import moment from 'moment-timezone';

export default {
  computed: {
    formattedDate() {
      if (this.event.date) {
        return moment(this.event.date).tz(this.event.tz).format('LLLL zz');
      }
      return '';
    },
  },
};
