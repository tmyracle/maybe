import { Institution, PrismaClient, Provider } from '@prisma/client'

const prisma = new PrismaClient()

/*
 * NOTE: seeding should be idempotent
 */
async function main() {
    const institutions: (Pick<Institution, 'id' | 'name'> & {
        providers: { provider: Provider; providerId: string; logoUrl: string; rank?: number }[]
    })[] = [
        {
            id: 1,
            name: 'Capital One',
            providers: [
                {
                    provider: 'TELLER',
                    providerId: 'capital_one',
                    logoUrl: 'https://teller.io/images/banks/capital_one.jpg',
                    rank: 1,
                },
            ],
        },
        {
            id: 2,
            name: 'Wells Fargo',
            providers: [
                {
                    provider: 'TELLER',
                    providerId: 'wells_fargo',
                    logoUrl: 'https://teller.io/images/banks/wells_fargo.jpg',
                },
            ],
        },
    ]

    await prisma.$transaction([
        // create institution linked to provider institutions
        ...institutions.map(({ id, name, providers }) =>
            prisma.institution.upsert({
                where: { id },
                create: {
                    name,
                    providers: {
                        connectOrCreate: providers.map(
                            ({ provider, providerId, logoUrl, rank = 0 }) => ({
                                where: {
                                    provider_providerId: { provider, providerId },
                                },
                                create: {
                                    provider,
                                    providerId,
                                    logoUrl,
                                    name,
                                    rank,
                                },
                            })
                        ),
                    },
                },
                update: {},
            })
        ),
    ])
}

// Only run the seed in preview environments, not production
if (process.env.NODE_ENV !== 'production') {
    console.log('seeding...')
    main()
        .catch((e) => {
            console.error('prisma seed failed', e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
} else {
    console.warn('seeding skipped', process.env.NODE_ENV)
}
