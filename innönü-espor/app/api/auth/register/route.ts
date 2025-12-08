import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, firstName, lastName, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      { message: 'Kayıt başarılı', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json(
        { error: `Geçersiz veri: ${errorMessage}` },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: `Kayıt sırasında bir hata oluştu: ${errorMessage}` },
      { status: 500 }
    )
  }
}

