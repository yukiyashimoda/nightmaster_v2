import { redirect } from 'react-router'
import type { Route } from '../+types/routes/login'
import { isAuthenticated, makeSessionCookie, VALID_ID, VALID_PASS } from '../../src/lib/auth.server'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'

export async function loader({ request }: Route.LoaderArgs) {
  if (isAuthenticated(request)) {
    throw redirect('/')
  }
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const id = formData.get('id_field') as string
  const pass = formData.get('pass_field') as string

  if (id === VALID_ID && pass === VALID_PASS) {
    throw redirect('/', {
      headers: { 'Set-Cookie': makeSessionCookie() },
    })
  }
  return { error: 'IDまたはパスワードが違います' }
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const error = actionData?.error

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-brand-plum text-base font-audiowide">
              <span style={{ color: '#F1896C' }}>N</span>ight Master v1
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-beige shadow-sm p-6">
          <h1 className="text-lg font-bold text-brand-plum mb-5">ログイン</h1>

          <form method="post" className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-brand-plum">ID</Label>
              <Input name="id_field" required placeholder="ID を入力" autoComplete="username" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-brand-plum">パスワード</Label>
              <Input name="pass_field" type="password" required placeholder="パスワードを入力" autoComplete="current-password" />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11"
            >
              ログイン
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
