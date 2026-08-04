import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import {
  useCheckoutCommandQuery,
  useRecheckCheckoutCommandMutation,
} from '@/hooks/billing/useCheckoutCommandQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type {
  CheckoutPublicOutcome,
  PurchasableSubscriptionPlan,
} from '@/types/billing'

const planLabels: Record<PurchasableSubscriptionPlan, string> = {
  student: '学生计划',
  teacher_supported: '教师支持计划',
  family: '家庭计划',
}

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams()
  const checkoutRef = searchParams.get('checkoutRef')
  const commandQuery = useCheckoutCommandQuery(checkoutRef)
  const recheckMutation = useRecheckCheckoutCommandMutation(checkoutRef)
  const outcome = resolveOutcome({
    checkoutRef,
    isLoading: commandQuery.isPending,
    isError: commandQuery.isError,
    outcome: commandQuery.data?.outcome,
    effectivePlan: commandQuery.data?.effectivePlan,
    beneficiaries: commandQuery.data?.beneficiaries,
  })

  const recheck = () => {
    if (!recheckMutation.isPending) recheckMutation.mutate()
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0" size="narrow">
        <CheckoutOutcome
          outcome={outcome}
          plan={commandQuery.data?.effectivePlan ?? null}
          beneficiaries={commandQuery.data?.beneficiaries ?? []}
          pollingExhausted={commandQuery.hasExhaustedAutoPolling}
          rechecking={recheckMutation.isPending}
          onRecheck={recheck}
        />
      </PageContainer>
    </DashboardLayout>
  )
}

function CheckoutOutcome({
  outcome,
  plan,
  beneficiaries,
  pollingExhausted,
  rechecking,
  onRecheck,
}: {
  outcome: CheckoutPublicOutcome
  plan: PurchasableSubscriptionPlan | null
  beneficiaries: string[]
  pollingExhausted: boolean
  rechecking: boolean
  onRecheck: () => void
}) {
  if (outcome === 'active' && plan) {
    return (
      <>
        <PageHeader
          eyebrow="付款状态"
          title="付款已确认"
          description="STOA 已确认付款并启用相应权益。"
        />
        <ResultCard
          icon={CheckCircle2}
          title="计划已生效"
          liveCopy="付费权益现已启用。"
        >
          <p>
            当前计划：<strong className="text-foreground">{planLabels[plan]}</strong>
          </p>
          <div>
            <p className="font-medium text-foreground">受益学生</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {beneficiaries.map((beneficiary) => (
                <li key={beneficiary}>{beneficiary}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/billing">查看账单</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/parent">返回家长主页</Link>
            </Button>
          </div>
        </ResultCard>
      </>
    )
  }

  if (outcome === 'not_completed') {
    return (
      <>
        <PageHeader
          eyebrow="付款状态"
          title="付款未完成"
          description="此次结账没有更改现有计划或权益。"
        />
        <ResultCard
          icon={XCircle}
          title="可以重新开始"
          liveCopy="没有启用任何付费权益。"
        >
          <p>您可以返回账单页面，检查计划后发起新的结账。</p>
          <Button asChild>
            <Link to="/billing">返回账单</Link>
          </Button>
        </ResultCard>
      </>
    )
  }

  if (outcome === 'support_needed') {
    return (
      <>
        <PageHeader
          eyebrow="付款状态"
          title="需要帮助"
          description="我们无法在此页面安全地确认本次付款。"
        />
        <ResultCard
          icon={CircleAlert}
          title="请勿再次付款"
          liveCopy="请联系 STOA 支持，我们会核对原始结账记录。"
        >
          <p>为避免重复付款，请先重新检查原始操作或联系支持。</p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onRecheck}
              disabled={rechecking}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {rechecking ? '正在重新检查' : '重新检查付款状态'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/support">联系支持</Link>
            </Button>
          </div>
        </ResultCard>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="付款状态"
        title="正在确认付款"
        description="返回此页面只是导航提示，最终状态以 STOA 的付款记录为准。"
      />
      <ResultCard
        icon={pollingExhausted ? Clock3 : LoaderCircle}
        iconClassName={pollingExhausted ? undefined : 'animate-spin'}
        title={pollingExhausted ? '确认时间比预期更长' : '正在安全确认'}
        liveCopy={
          pollingExhausted
            ? '付款仍在确认中。您可以重新检查原始操作或联系支持。'
            : '正在向 STOA 确认原始付款操作。'
        }
      >
        <p>确认期间无法开始新的结账，以免发生重复付款。</p>
        {pollingExhausted && (
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onRecheck}
              disabled={rechecking}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {rechecking ? '正在重新检查' : '重新检查付款状态'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/support">联系支持</Link>
            </Button>
          </div>
        )}
      </ResultCard>
    </>
  )
}

function ResultCard({
  icon: Icon,
  iconClassName,
  title,
  liveCopy,
  children,
}: {
  icon: typeof CheckCircle2
  iconClassName?: string
  title: string
  liveCopy: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon
            className={`h-5 w-5 text-primary ${iconClassName ?? ''}`}
            aria-hidden="true"
          />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p role="status" aria-live="polite">{liveCopy}</p>
        {children}
      </CardContent>
    </Card>
  )
}

function resolveOutcome({
  checkoutRef,
  isLoading,
  isError,
  outcome,
  effectivePlan,
  beneficiaries,
}: {
  checkoutRef: string | null
  isLoading: boolean
  isError: boolean
  outcome: CheckoutPublicOutcome | undefined
  effectivePlan: PurchasableSubscriptionPlan | null | undefined
  beneficiaries: string[] | undefined
}): CheckoutPublicOutcome {
  if (!checkoutRef?.trim() || isError) return 'support_needed'
  if (isLoading || outcome === 'confirming') return 'confirming'
  if (outcome === 'active') {
    return effectivePlan && beneficiaries?.length ? 'active' : 'support_needed'
  }
  if (outcome === 'not_completed' || outcome === 'support_needed') return outcome
  return 'support_needed'
}
