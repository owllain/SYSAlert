import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear Entidad Financiera de prueba
  const entity = await prisma.financialEntity.upsert({
    where: { code: 'BN001' },
    update: {},
    create: {
      name: 'Banco Nacional de Pruebas',
      code: 'BN001',
    },
  });

  console.log('Entidad financiera creada:', entity.name);

  // Usuarios de prueba
  const users = [
    {
      name: 'Administrador del Sistema',
      username: 'admin',
      email: 'admin@sysalert.com',
      identification: '1-0000-0000',
      idType: 'cedula',
      role: 'admin',
      financialEntityId: entity.id,
    },
    {
      name: 'Analista de Alertas',
      username: 'analyst',
      email: 'analyst@sysalert.com',
      identification: '2-0000-0000',
      idType: 'cedula',
      role: 'analyst',
      financialEntityId: entity.id,
    },
    {
      name: 'Observador Interbancario',
      username: 'viewer',
      email: 'viewer@sysalert.com',
      identification: '3-0000-0000',
      idType: 'cedula',
      role: 'viewer',
      financialEntityId: entity.id,
    },
  ];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role },
      create: user,
    });
    console.log(`Usuario creado/actualizado: ${createdUser.username} (${createdUser.role})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
