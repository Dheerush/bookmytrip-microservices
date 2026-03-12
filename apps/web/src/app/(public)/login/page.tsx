import AuthSplitLayout from "@/components/auth/AuthSplitLayout/AuthSplitLayout"
import LoginForm from "@/features/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthSplitLayout
      rightImage="/auth/login.jpg"
      quote="Your next adventure awaits."
      left={<LoginForm />}
    />
  )
}