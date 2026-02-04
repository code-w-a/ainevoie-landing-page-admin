import { useHits } from "react-instantsearch";

const EmptyState = () => {
  const { items } = useHits();

  return (
    <>
      {items?.length == 0 ? (
        <div className="p-8">
          <p className="text-center text-base text-body">No items found...</p>
        </div>
      ) : null}
    </>
  );
};

export default EmptyState;
