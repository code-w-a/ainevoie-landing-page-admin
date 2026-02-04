import { integrations, messages } from "@integrations-config";
import algoliasearch from "algoliasearch";
import { useEffect } from "react";
import { Hits, InstantSearch } from "react-instantsearch";
import CustomHits from "./CustomHits";
import SearchBox from "./CustomSearchBox";
import EmptyState from "./EmptyState";

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_PROJECT_ID as string;
const API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY as string;
const INDEX = process.env.NEXT_PUBLIC_ALGOLIA_INDEX as string;

const algoliaClient = algoliasearch(APP_ID, API_KEY);

type Props = {
  searchModalOpen: boolean;
  setSearchModalOpen: (value: boolean) => void;
};

const GlobalSearchModal = (props: Props) => {
  const { searchModalOpen, setSearchModalOpen } = props;

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: any) {
      if (!event.target.closest(".modal-content")) {
        setSearchModalOpen(false);
      }
    }

    if (searchModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchModalOpen, setSearchModalOpen]);

  if (!searchModalOpen) return null;

  return (
    <div className="fixed top-0 left-0 z-99999 flex h-full min-h-screen w-full justify-center bg-[rgba(94,93,93,0.25)] px-4 py-[12vh] backdrop-blur-xs">
      <div className="modal-content relative z-20 flex w-full max-w-[600px] flex-col overflow-clip rounded-xl bg-white shadow-lg dark:bg-black">
        <InstantSearch
          insights={false}
          searchClient={algoliaClient}
          indexName={INDEX}
        >
          <SearchBox />
          <EmptyState />
          <div className="flex-1 overflow-y-auto">
            {integrations?.isAlgoliaEnabled ? (
              <Hits
                hitComponent={({ hit }) => (
                  <CustomHits
                    hit={hit}
                    setSearchModalOpen={setSearchModalOpen}
                  />
                )}
              />
            ) : (
              <div className="text-body text-center text-base">
                {messages?.algolia}
              </div>
            )}
          </div>
        </InstantSearch>
      </div>

      <button
        onClick={() => setSearchModalOpen(false)}
        className="border-stroke text-body hover:text-dark dark:border-stroke-dark z-999999 -mt-[22px] -ml-[22px] flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white dark:bg-[#1F233A] dark:hover:text-white"
      >
        <svg
          className="fill-current"
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.9983 10.586L17.9483 5.63603L19.3623 7.05003L14.4123 12L19.3623 16.95L17.9483 18.364L12.9983 13.414L8.04828 18.364L6.63428 16.95L11.5843 12L6.63428 7.05003L8.04828 5.63603L12.9983 10.586Z"
            fill=""
          ></path>
        </svg>
      </button>
    </div>
  );
};

export default GlobalSearchModal;
