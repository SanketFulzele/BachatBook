import { RefreshCw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface DataErrorProps {
  message?: string
  onRetry?: () => void
}

export function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <Alert variant="error" title="Could not load your Bhishi">
      <p>{message ?? 'Please check your connection and try again.'}</p>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={onRetry}
        >
          Try again
        </Button>
      ) : null}
    </Alert>
  )
}
