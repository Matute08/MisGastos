<template>
  <div class="space-y-3">
    <!-- Filtros Desktop -->
    <div class="hidden lg:block card">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Tarjeta</label>
          <select
            :value="filters.card_id"
            @change="$emit('updateFilter', { key: 'card_id', value: $event.target.value })"
            class="input-field"
          >
            <option value="">Todas las tarjetas</option>
            <option
              v-for="card in availableCardsForMonth"
              :key="card.id"
              :value="card.available_card_id"
            >
              {{ card.available_card?.name || card.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Categoría</label>
          <select
            :value="filters.category_id"
            @change="$emit('updateFilter', { key: 'category_id', value: $event.target.value })"
            class="input-field"
          >
            <option value="">Todas las categorías</option>
            <option
              v-for="category in availableCategoriesForMonth"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Mes</label>
          <select
            :value="filters.month"
            @change="$emit('updateFilter', { key: 'month', value: Number($event.target.value) })"
            class="input-field"
          >
            <option
              v-for="(name, idx) in monthNames"
              :key="idx"
              :value="idx + 1"
            >
              {{ name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Año</label>
          <select
            :value="filters.year"
            @change="$emit('updateFilter', { key: 'year', value: Number($event.target.value) })"
            class="input-field"
          >
            <option
              v-for="year in availableYears"
              :key="year"
              :value="year"
            >
              {{ year }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">Estado</label>
          <select
            :value="filters.payment_status_id"
            @change="$emit('updateFilter', { key: 'payment_status_id', value: $event.target.value ? Number($event.target.value) : null })"
            class="input-field"
          >
            <option :value="null">Todos los estados</option>
            <option
              v-for="status in availablePaymentStatuses"
              :key="status.id"
              :value="status.id"
            >
              {{ status.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Active filters pills + clear -->
      <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap items-center gap-2">
        <span
          v-if="filters.card_id"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold ring-1 ring-inset ring-primary-200 dark:ring-primary-700"
        >
          Tarjeta filtrada
          <button @click="$emit('clearFilter', 'card_id')" class="ml-0.5 hover:text-primary-900">
            <X class="h-3 w-3" />
          </button>
        </span>
        <span
          v-if="filters.category_id"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold ring-1 ring-inset ring-primary-200 dark:ring-primary-700"
        >
          Categoría filtrada
          <button @click="$emit('clearFilter', 'category_id')" class="ml-0.5 hover:text-primary-900">
            <X class="h-3 w-3" />
          </button>
        </span>
        <span
          v-if="filters.payment_status_id"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold ring-1 ring-inset ring-primary-200 dark:ring-primary-700"
        >
          Estado filtrado
          <button @click="$emit('clearFilter', 'payment_status_id')" class="ml-0.5 hover:text-primary-900">
            <X class="h-3 w-3" />
          </button>
        </span>
        <button
          @click="$emit('resetFilters')"
          class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-gray-200 font-medium underline"
        >
          Limpiar todos los filtros
        </button>
      </div>
    </div>

    <!-- Filtros Mobile y Tablet (Drawer/Colapsable) -->
    <div class="block lg:hidden card !p-4">
      <button
        @click="isMobileFiltersOpen = !isMobileFiltersOpen"
        class="w-full flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-gray-300"
      >
        <span class="flex items-center gap-2">
          <SlidersHorizontal class="h-4 w-4 text-primary-600 dark:text-primary-400" />
          Filtros y Período
        </span>
        <ChevronDown
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-180': isMobileFiltersOpen }"
        />
      </button>

      <div v-show="isMobileFiltersOpen" class="mt-4 space-y-3 pt-3 border-t border-slate-100 dark:border-gray-700">
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Tarjeta</label>
            <select
              :value="filters.card_id"
              @change="$emit('updateFilter', { key: 'card_id', value: $event.target.value })"
              class="input-field !py-1.5 !px-2.5 text-xs"
            >
              <option value="">Todas</option>
              <option
                v-for="card in availableCardsForMonth"
                :key="card.id"
                :value="card.available_card_id"
              >
                {{ card.available_card?.name || card.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Categoría</label>
            <select
              :value="filters.category_id"
              @change="$emit('updateFilter', { key: 'category_id', value: $event.target.value })"
              class="input-field !py-1.5 !px-2.5 text-xs"
            >
              <option value="">Todas</option>
              <option
                v-for="category in availableCategoriesForMonth"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Mes</label>
            <select
              :value="filters.month"
              @change="$emit('updateFilter', { key: 'month', value: Number($event.target.value) })"
              class="input-field !py-1.5 !px-2.5 text-xs"
            >
              <option
                v-for="(name, idx) in monthNames"
                :key="idx"
                :value="idx + 1"
              >
                {{ name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Año</label>
            <select
              :value="filters.year"
              @change="$emit('updateFilter', { key: 'year', value: Number($event.target.value) })"
              class="input-field !py-1.5 !px-2.5 text-xs"
            >
              <option
                v-for="year in availableYears"
                :key="year"
                :value="year"
              >
                {{ year }}
              </option>
            </select>
          </div>

          <div class="col-span-2">
            <label class="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Estado</label>
            <select
              :value="filters.payment_status_id"
              @change="$emit('updateFilter', { key: 'payment_status_id', value: $event.target.value ? Number($event.target.value) : null })"
              class="input-field !py-1.5 !px-2.5 text-xs"
            >
              <option :value="null">Todos</option>
              <option
                v-for="status in availablePaymentStatuses"
                :key="status.id"
                :value="status.id"
              >
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Buscador -->
    <div class="sm:px-0">
      <SearchBar
        :model-value="searchQuery"
        @update:model-value="$emit('update:searchQuery', $event)"
        placeholder="Buscar por descripción..."
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-vue-next';
import SearchBar from '@/components/ui/SearchBar.vue';

const props = defineProps({
  filters: { type: Object, required: true },
  availableCardsForMonth: { type: Array, default: () => [] },
  availableCategoriesForMonth: { type: Array, default: () => [] },
  monthNames: { type: Array, required: true },
  availableYears: { type: Array, required: true },
  availablePaymentStatuses: { type: Array, default: () => [] },
  searchQuery: { type: String, default: '' }
});

defineEmits(['updateFilter', 'clearFilter', 'resetFilters', 'update:searchQuery']);

const isMobileFiltersOpen = ref(false);

const hasActiveFilters = computed(() => {
  return Boolean(props.filters.card_id || props.filters.category_id || props.filters.payment_status_id);
});
</script>