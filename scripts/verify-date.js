// Verificar qué devuelve exactamente new Date('2025-10-01')
const date = new Date('2025-10-01');
console.log('Fecha:', date.toISOString().split('T')[0]);
console.log('Año:', date.getFullYear());
console.log('Mes (0-11):', date.getMonth());
console.log('Mes (1-12):', date.getMonth() + 1);
console.log('Día:', date.getDate());

console.log('\nMeses en JavaScript (0-indexado):');
console.log('0 = enero, 1 = febrero, ..., 8 = septiembre, 9 = octubre, 10 = noviembre, 11 = diciembre');

console.log('\nPor lo tanto:');
console.log('new Date("2025-10-01").getMonth() =', date.getMonth(), '= octubre');
