import { PageIntro, StoreContainer } from "@/components/shared/PageIntro";

/** Sign-in, registration and password pages: a plain page with a large title and a narrow form column. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <StoreContainer>
      <PageIntro title={title} lead={description} />
      <div className="max-w-[448px]">
        {children}
        {footer && <div className="mt-8 text-[15px] text-grey-700">{footer}</div>}
      </div>
    </StoreContainer>
  );
}
