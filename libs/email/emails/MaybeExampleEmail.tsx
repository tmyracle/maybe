import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'
import * as React from 'react'

interface MaybeExampleEmailProps {
    name: string
    url: string
}

const baseUrl = process.env.CLIENT_URL ? `https://${process.env.CLIENT_URL}` : ''

export function MaybeExampleEmail({ name, url }: MaybeExampleEmailProps) {
    const previewText = `Welcome to Maybe`

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                cyan: {
                                    DEFAULT: '#3BC9DB',
                                    50: '#D7F6FA',
                                    300: '#99E9F2',
                                    400: '#66D9E8',
                                    500: '#3BC9DB',
                                },
                                gray: {
                                    DEFAULT: '#34363C',
                                    25: '#DEE2E6',
                                    50: '#ADB5BD',
                                    100: '#868E96',
                                    200: '#4B4F55',
                                    300: '#44474C',
                                    400: '#3D4045',
                                    500: '#34363C',
                                    600: '#2C2D32',
                                    700: '#232428',
                                    800: '#1C1C20',
                                },
                                transparent: 'transparent',
                                current: 'currentColor',
                                black: '#16161A',
                                white: '#F8F9FA',
                            },
                            fontSize: {
                                sm: ['0.75rem', '1rem'],
                                base: ['0.875rem', '1.5rem'],
                                lg: ['1rem', '1.5rem'],
                                xl: ['1.125rem', '1.5rem'],
                                '2xl': ['1.25rem', '2rem'],
                                '3xl': ['1.5rem', '2rem'],
                                '4xl': ['1.875rem', '2.5rem'],
                                '5xl': ['2.5rem', '3.5rem'],
                            },
                        },
                    },
                }}
            >
                <Body className="bg-black my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${baseUrl}/static/maybe-box.png`}
                                width="60"
                                height="60"
                                alt="Maybe"
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-white font-display text-[24px] font-medium text-center p-0 my-[30px] mx-0">
                            Welcome to Maybe
                        </Heading>
                        <Text className="text-white text-[14px] leading-[24px]">Hello {name},</Text>
                        <Text className="text-white text-[14px] leading-[24px]">
                            We're excited to join you on your personal finance journey! Here's a few
                            quick steps you can take to get the most out of Maybe.
                        </Text>
                        <Section className="text-white mt-[32px] mb-[32px] text-center">
                            <Text className="text-lg">Connect your bank accounts</Text>
                            <Text className="text-lg">Add your investments and assets</Text>
                            <Text className="text-lg">Set up your financial goals</Text>
                        </Section>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="px-4 py-4 rounded text-base bg-cyan text-gray-700 shadow hover:bg-cyan-400 focus:bg-cyan-400 focus:ring-cyan inline-flex items-center justify-center text-center font-medium leading-6 whitespace-nowrap select-none cursor-pointer focus:outline-none focus:ring focus:ring-opacity-60"
                                href={url}
                            >
                                Let's get started
                            </Button>
                        </Section>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-gray-50 text-[12px] leading-[24px]">
                            This email was intended for <span className="text-white">{name}</span>.
                            If you were not expecting this email, you can ignore it. If you are
                            concerned about your account's safety, please reply to this email to get
                            in touch with us.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export default MaybeExampleEmail
