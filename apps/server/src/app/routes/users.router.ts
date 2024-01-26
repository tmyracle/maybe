import { Router } from 'express'
import { subject } from '@casl/ability'
import { z } from 'zod'
import { DateUtil, type SharedType } from '@maybe-finance/shared'
import endpoint from '../lib/endpoint'
import { render } from '@react-email/render'
import { MaybeExampleEmail } from '@maybe-finance/emails'
import env from '../../env'
import {
    type OnboardingState,
    type RegisteredStep,
    UpdateOnboardingSchema,
} from '@maybe-finance/server/features'

const router = Router()

router.get(
    '/',
    endpoint.create({
        resolve: async ({ ctx }) => {
            return ctx.userService.get(ctx.user!.id)
        },
    })
)

router.get(
    '/onboarding/:flow',
    endpoint.create({
        resolve: async ({ ctx, req }) => {
            let onboarding: SharedType.OnboardingResponse

            switch (req.params.flow) {
                case 'main':
                    onboarding = await ctx.userService.buildMainOnboarding(ctx.user!.id)
                    break
                case 'sidebar':
                    onboarding = await ctx.userService.buildSidebarOnboarding(ctx.user!.id)
                    break
                default:
                    throw new Error(`${req.params.flow} is not a valid onboarding flow key`)
            }

            const { steps, currentStep, progress, isComplete, isMarkedComplete } = onboarding

            return {
                steps,
                currentStep,
                progress,
                isComplete,
                isMarkedComplete,
            }
        },
    })
)

router.put(
    '/onboarding',
    endpoint.create({
        input: UpdateOnboardingSchema,
        resolve: async ({ ctx, input }) => {
            const user = await ctx.prisma.user.findFirstOrThrow({
                where: { id: ctx.user!.id },
                select: { id: true, onboarding: true },
            })

            const onboardingState = user.onboarding as OnboardingState | null

            // Initialize onboarding state
            const onboarding = onboardingState
                ? onboardingState
                : ({
                      main: { markedComplete: false, steps: [] },
                      sidebar: { markedComplete: false, steps: [] },
                  } as OnboardingState)

            input.updates.forEach((update: RegisteredStep) => {
                const oldStepIdx = onboarding[input.flow].steps.findIndex(
                    (step) => step.key === update.key
                )

                // Create or update
                if (oldStepIdx < 0) {
                    onboarding[input.flow].steps.push(update)
                } else {
                    onboarding[input.flow].steps[oldStepIdx] = update
                }
            })

            if (input.flow === 'sidebar' && input.markedComplete != null) {
                onboarding['sidebar'].markedComplete = input.markedComplete
            }

            ctx.logger.info(
                `User onboarding updated. flow=${input.flow} updated=${input.updates.length} user=${
                    ctx.user!.id
                }`,
                input
            )

            return ctx.prisma.user.update({
                where: { id: ctx.user!.id },
                data: { onboarding },
            })
        },
    })
)

router.get(
    '/auth-profile',
    endpoint.create({
        resolve: async ({ ctx }) => {
            return ctx.userService.getAuthProfile(ctx.user!.id)
        },
    })
)

router.get(
    '/subscription',
    endpoint.create({
        resolve: async ({ ctx }) => {
            if (!ctx.user || !ctx.user.id) {
                throw new Error('User not found')
            }

            return ctx.userService.getSubscription(ctx.user.id)
        },
    })
)

router.put(
    '/',
    endpoint.create({
        input: z
            .object({
                monthlyDebtUser: z.number().nullable(),
                monthlyIncomeUser: z.number().nullable(),
                monthlyExpensesUser: z.number().nullable(),
                goals: z.string().array(),
                riskAnswers: z
                    .object({ questionKey: z.string(), choiceKey: z.string() })
                    .array()
                    .min(1),
                household: z.enum([
                    'single',
                    'singleWithDependents',
                    'dual',
                    'dualWithDependents',
                    'retired',
                ]),
                country: z.string().nullable(),
                state: z.string().nullable(),
                maybeGoals: z.enum(['aggregate', 'advice', 'plan']).array(),
                maybeGoalsDescription: z.string().nullable(),
                maybe: z.string().nullable(),
                title: z.string().nullable(),
                firstName: z.string(),
                lastName: z.string(),
                dob: z.string().transform((d) => DateUtil.datetimeTransform(d).toJSDate()),
                linkAccountDismissedAt: z.date(),
            })
            .partial(),
        resolve: ({ input, ctx }) => {
            if (!ctx.user || !ctx.user.id) {
                throw new Error('Could not update user.  User not found')
            }

            return ctx.userService.update(ctx.user.id, input)
        },
    })
)

router.get(
    '/net-worth',
    endpoint.create({
        input: z
            .object({
                start: z.string().transform(DateUtil.dateTransform),
                end: z.string().transform(DateUtil.dateTransform),
            })
            .partial(),
        resolve: ({ ctx, input: { start, end } }) => {
            return ctx.userService.getNetWorthSeries(ctx.user!.id, start, end)
        },
    })
)

router.get(
    '/:id/net-worth',
    endpoint.create({
        input: z
            .object({
                start: z.string().transform(DateUtil.dateTransform),
                end: z.string().transform(DateUtil.dateTransform),
            })
            .partial(),
        resolve: async ({ ctx, req, input: { start, end } }) => {
            const user = await ctx.userService.get(+req.params.id)
            ctx.ability.throwUnlessCan('read', subject('User', user))
            return ctx.userService.getNetWorthSeries(user.id, start, end)
        },
    })
)

router.get(
    '/net-worth/:date',
    endpoint.create({
        resolve: ({ ctx, req }) => {
            return ctx.userService.getNetWorth(
                ctx.user!.id,
                DateUtil.dateTransform(req.params.date)
            )
        },
    })
)

router.get(
    '/:id/net-worth/:date',
    endpoint.create({
        resolve: async ({ ctx, req }) => {
            const user = await ctx.userService.get(+req.params.id)
            ctx.ability.throwUnlessCan('read', subject('User', user))
            return ctx.userService.getNetWorth(user.id, DateUtil.dateTransform(req.params.date))
        },
    })
)

router.get(
    '/:id/account-rollup',
    endpoint.create({
        input: z
            .object({
                start: z.string().transform(DateUtil.dateTransform),
                end: z.string().transform(DateUtil.dateTransform),
            })
            .partial(),
        resolve: async ({ ctx, input: { start, end }, req }) => {
            const user = await ctx.userService.get(+req.params.id)
            ctx.ability.throwUnlessCan('read', subject('User', user))
            return ctx.accountService.getAccountRollup(user.id, start, end)
        },
    })
)

router.get(
    '/insights',
    endpoint.create({
        resolve: ({ ctx }) => {
            return ctx.insightService.getUserInsights({ userId: ctx.user!.id })
        },
    })
)

router.get(
    '/:id/insights',
    endpoint.create({
        resolve: async ({ ctx, req }) => {
            const user = await ctx.userService.get(+req.params.id)
            ctx.ability.throwUnlessCan('read', subject('User', user))
            return ctx.insightService.getUserInsights({ userId: user.id })
        },
    })
)

// TODO: Implement verification email using internal email service instead of Auth0
router.post(
    '/resend-verification-email',
    endpoint.create({
        input: z.object({
            authId: z.string().optional(),
        }),
        resolve: async ({ input, ctx }) => {
            const authId = input.authId ?? ctx.user?.authId
            if (!authId) throw new Error('User not found')

            if (!ctx.user?.email) throw new Error('User email not found')

            const emailHtml = render(
                MaybeExampleEmail({ name: ctx.user?.name, email: ctx.user?.email })
            )
            await ctx.emailService.send({
                to: ctx.user?.email,
                subject: 'Welcome to Maybe',
                htmlBody: emailHtml,
            })

            //await ctx.managementClient.sendEmailVerification({ user_id: authId })

            ctx.logger.info(`Sent verification email to ${authId}`)

            return { success: true }
        },
    })
)

router.put(
    '/change-password',
    endpoint.create({
        input: z.object({
            newPassword: z.string(),
            currentPassword: z.string(),
        }),
        resolve: async ({ input, ctx, req }) => {
            if (!req.user || !req.user.sub) {
                throw new Error('Unable to update password.  No user found.')
            }

            const { newPassword, currentPassword } = input

            try {
                await ctx.authUserService.updatePassword(req.user.sub, currentPassword, newPassword)
            } catch (err) {
                const errMessage = 'Could not reset password'
                // Do not log the full error here, the user's password could be in it!
                ctx.logger.error('Could not reset password')

                return { success: false, error: errMessage }
            }

            return { success: true }
        },
    })
)

router.post(
    '/checkout-session',
    endpoint.create({
        input: z.object({
            plan: z.string(),
        }),
        resolve: async ({ ctx, req, input }) => {
            if (!req.user?.sub || !ctx.user) {
                throw new Error('Unable to create checkout session. No user found.')
            }

            const session = await ctx.stripe.checkout.sessions.create({
                line_items: [
                    {
                        price:
                            input.plan === 'yearly'
                                ? env.NX_STRIPE_PREMIUM_YEARLY_PRICE_ID
                                : env.NX_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${req.headers.origin}/settings?tab=billing&status=success`,
                cancel_url: `${req.headers.origin}/settings?tab=billing&status=cancelled`,
                allow_promotion_codes: true,

                client_reference_id: req.user.sub,

                // Provide customer ID or user email, not both
                ...(ctx.user.stripeCustomerId
                    ? {
                          customer: ctx.user.stripeCustomerId,
                      }
                    : {
                          customer_email:
                              (await ctx.authUserService.get(req.user.sub)).email ?? undefined,
                      }),
            })

            if (!session.url) throw new Error('Failed to create checkout session with URL.')

            return { url: session.url }
        },
    })
)

router.post(
    '/customer-portal-session',
    endpoint.create({
        resolve: async ({ ctx, req }) => {
            if (!req.user?.sub || !ctx.user || !ctx.user.stripeCustomerId) {
                throw new Error('Unable to create customer portal session. No user/customer found.')
            }

            const session = await ctx.stripe.billingPortal.sessions.create({
                customer: ctx.user.stripeCustomerId,
                return_url: `${req.headers.origin}/settings?tab=billing`,
            })

            if (!session.url) throw new Error('Failed to create customer portal session with URL.')

            return { url: session.url }
        },
    })
)

router.delete(
    '/',
    endpoint.create({
        input: z.object({
            confirm: z.literal(true),
        }),
        resolve: async ({ ctx }) => {
            const { id } = ctx.user!
            ctx.ability.throwUnlessCan('delete', subject('User', ctx.user!))
            await ctx.userService.delete(id)
        },
    })
)

router.delete(
    '/:id',
    endpoint.create({
        input: z.object({
            confirm: z.literal(true),
        }),
        resolve: async ({ ctx, req }) => {
            const user = await ctx.userService.get(+req.params.id)
            ctx.ability.throwUnlessCan('delete', subject('User', user))
            await ctx.userService.delete(user.id)
        },
    })
)

router.get(
    '/card',
    endpoint.create({
        resolve: async ({ ctx }) => {
            return ctx.userService.getMemberCard(
                ctx.user!.memberId,
                env.NX_CLIENT_URL_CUSTOM || env.NX_CLIENT_URL
            )
        },
    })
)

export default router
