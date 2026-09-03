<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Inbox, Receipt, Wallet, CreditCard, PiggyBank, SearchX,
  CircleDollarSign, Landmark, Target, ShoppingBag, Heart, Plane, Coins
} from 'lucide-vue-next'

const props = defineProps({
  icon: { type: String, default: 'Inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionLink: { type: String, default: '' }
})

const emit = defineEmits(['action'])
const router = useRouter()

const iconMap = {
  Inbox, Receipt, Wallet, CreditCard, PiggyBank, SearchX,
  'circle-dollar-sign': CircleDollarSign, Landmark, Target,
  ShoppingBag, Heart, Plane, Coins
}

const iconComponent = computed(() => iconMap[props.icon] || Inbox)

const handleAction = () => {
  if (props.actionLink) {
    router.push(props.actionLink)
  } else {
    emit('action')
  }
}
</script>

<template>
  <div class="card text-center py-12 sm:py-16 px-4">
    <div class="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <component :is="iconComponent" class="h-8 w-8 text-slate-400 dark:text-gray-500" />
    </div>
    <h3 class="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-slate-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-4 leading-relaxed">{{ description }}</p>
    <button
      v-if="actionLabel"
      @click="handleAction"
      class="btn-primary inline-flex items-center gap-2 mx-auto"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
