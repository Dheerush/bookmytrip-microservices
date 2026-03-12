import AuthSplitLayout from "@/components/auth/AuthSplitLayout/AuthSplitLayout"
import RegisterForm from "@/features/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      rightImage="/auth/re.jpg"
      quote="To travel is to live."
      left={<RegisterForm />}
    />
  )
}