export function NoAccess({ area }: { area?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-black/5 bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-red">
            <path
              d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2Zm10-11V7a4 4 0 0 0-8 0v3h8Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-bold text-navy">You don&apos;t have access</h1>
        <p className="mt-2 text-sm text-body">
          {area
            ? `Your account doesn't have permission to view ${area}.`
            : "Your account doesn't have permission to view this page."}{" "}
          If you think this is a mistake, ask an admin to grant you access.
        </p>
      </div>
    </div>
  );
}
