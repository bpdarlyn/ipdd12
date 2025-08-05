# UI Components Documentation

This directory contains reusable UI components for the IPDD12 Church Management System.

## Error Boundaries

### ErrorBoundary
A React error boundary component that catches JavaScript errors anywhere in the child component tree.

**Usage:**
```tsx
import ErrorBoundary from './components/ui/ErrorBoundary';

// Wrap individual components
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// Use with default error UI
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches and displays errors gracefully
- Shows different UI in development vs production
- Provides reload and navigation options
- Logs errors to console (can be extended to error reporting services)

## Loading States

### LoadingSpinner
Basic spinner component with customizable size and overlay options.

**Usage:**
```tsx
import LoadingSpinner from './components/ui/LoadingSpinner';

// Basic spinner
<LoadingSpinner message="Loading..." />

// Full-page overlay
<LoadingSpinner overlay message="Processing..." size="large" />

// Small inline spinner
<LoadingSpinner size="small" message="" />
```

### Loading State Components

#### CardLoader
Skeleton loader for card-based layouts.

```tsx
import { CardLoader } from './components/ui/LoadingStates';

<CardLoader showImage={false} showActions={true} />
```

#### TableLoader
Skeleton loader for table layouts.

```tsx
import { TableLoader } from './components/ui/LoadingStates';

<TableLoader rows={5} columns={4} />
```

#### ListItemLoader
Skeleton loader for list items.

```tsx
import { ListItemLoader } from './components/ui/LoadingStates';

<ListItemLoader showAvatar={true} showMeta={true} />
```

#### LoadingButton
Button with integrated loading state.

```tsx
import { LoadingButton } from './components/ui/LoadingStates';

<LoadingButton
  loading={isSubmitting}
  onClick={handleSubmit}
  className="btn-primary"
  disabled={isSubmitting}
>
  Save Changes
</LoadingButton>
```

#### ProgressLoader
Progress bar with percentage display.

```tsx
import { ProgressLoader } from './components/ui/LoadingStates';

<ProgressLoader
  progress={75}
  message="Uploading files..."
  showPercentage={true}
/>
```

#### PageLoader
Full-page loading overlay.

```tsx
import { PageLoader } from './components/ui/LoadingStates';

{isLoading && <PageLoader message="Loading dashboard..." />}
```

#### FormLoader
Overlay loader for forms.

```tsx
import { FormLoader } from './components/ui/LoadingStates';

<div style={{ position: 'relative' }}>
  <form>
    {/* form fields */}
  </form>
  {isSubmitting && <FormLoader message="Saving..." />}
</div>
```

## Loading Hooks

### useLoading
Hook for managing single loading states with error handling.

```tsx
import { useLoading } from '../../hooks/useLoading';

const MyComponent = () => {
  const { isLoading, error, data, execute } = useLoading({
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error),
  });

  const handleSubmit = async () => {
    try {
      await execute(async () => {
        return await apiService.createReport(formData);
      });
    } catch (error) {
      // Error is automatically handled by the hook
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <div>{/* component content */}</div>;
};
```

### useMultipleLoading
Hook for managing multiple loading states simultaneously.

```tsx
import { useMultipleLoading } from '../../hooks/useLoading';

const MyComponent = () => {
  const { setLoading, isLoading, isAnyLoading } = useMultipleLoading();

  const handleDelete = async (id: number) => {
    const deleteKey = `delete-${id}`;
    try {
      setLoading(deleteKey, true);
      await apiService.deleteItem(id);
    } finally {
      setLoading(deleteKey, false);
    }
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <LoadingButton
            loading={isLoading(`delete-${item.id}`)}
            onClick={() => handleDelete(item.id)}
          >
            Delete
          </LoadingButton>
        </div>
      ))}
    </div>
  );
};
```

### useAsync
Hook for automatic async operations with dependencies.

```tsx
import { useAsync } from '../../hooks/useLoading';

const MyComponent = ({ reportId }) => {
  const { data: report, error, isLoading, retry } = useAsync(
    async () => await apiService.getReport(reportId),
    [reportId] // dependencies
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={retry} />;
  
  return <div>{report?.title}</div>;
};
```

## CSS Classes

### Loading States
- `.loading-container` - Basic loading container
- `.loading-overlay` - Full-page overlay
- `.loading-inline` - Inline loading state
- `.btn-loading` - Button loading state
- `.table-loading` - Table loading overlay
- `.card-loading` - Card shimmer effect

### Skeleton Loading
- `.skeleton-loader` - Container for skeleton elements
- `.skeleton-line` - Basic skeleton line
- `.skeleton-title` - Title skeleton (larger)
- `.skeleton-button` - Button skeleton
- `.skeleton-avatar` - Circular avatar skeleton

### Error Boundary
- `.error-boundary` - Main error boundary container
- `.error-boundary-content` - Content wrapper
- `.error-actions` - Action buttons container
- `.error-details` - Development error details

## Best Practices

1. **Error Boundaries:**
   - Place at strategic points in your component tree
   - Use granular boundaries for better isolation
   - Always provide fallback UI

2. **Loading States:**
   - Use skeleton loaders for better UX than spinners
   - Match skeleton structure to actual content
   - Provide meaningful loading messages

3. **Performance:**
   - Use `useMultipleLoading` for managing many loading states
   - Avoid excessive re-renders with proper memoization
   - Use `React.memo` for loading components when appropriate

4. **Accessibility:**
   - Loading states respect `prefers-reduced-motion`
   - Use appropriate ARIA labels
   - Ensure keyboard navigation works during loading

5. **Error Handling:**
   - Always provide retry mechanisms
   - Show user-friendly error messages
   - Log detailed errors for debugging