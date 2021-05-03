import { TestingModuleMetadata } from '../../src/test.factory';
import { company, random, address } from 'faker';
import { Address, Bid, EstimateData } from '../../src/modules/bid/entities';
import { BusinessType, PlansUploaded, ProjectType, Region } from '../../src/modules/bid/enums';
import { User } from '../../src/modules/base/entities';
import { Workbook } from 'exceljs';

export function BidMock(module: TestingModuleMetadata): void {
  const userRepository = module.repositories.userRepository;
  const bidRepository = module.repositories.bidRepository;
  const addressRepository = module.repositories.addressRepository;
  const estimateDataRepository = module.repositories.estimateDataRepository;
  const stateRepository = module.repositories.stateRepository;

  this.count = 0;

  const getEnumIntValues = (enumInt: any) =>
    Object.keys(enumInt)
      .map(k => enumInt[k])
      .filter(value => typeof value !== 'string');

  const setupEstimateData = async (): Promise<EstimateData> => {
    const FILENAME = 'BIDVITA-VALUES_20201203_0853';

    const [estimateData] = await estimateDataRepository.find({ take: 1, where: { deleted: false, name: FILENAME } });
    if (!estimateData) {
      const filePath = process.cwd() + '/templates/';
      const excelFile = await new Workbook().xlsx.readFile(`${filePath}${FILENAME}.xlsx`);
      const data = await excelFile.xlsx.writeBuffer(); // TODO confirm blob saved correctly by reading back later as .xlsx.
      return estimateDataRepository.save({
        id: null,
        name: FILENAME,
        data,
        deleted: false
      } as EstimateData);
    }
    return estimateData;
  };

  const setupUserBids = async (): Promise<void> => {
    const users = await userRepository.find({ take: 7, where: { deleted: false } });
    const estimateData = await setupEstimateData();
    const DEFAULT_STATE = 5;

    for (const user of users) {
      // create 4 bids each
      for (const idx of [1, 2, 3, 4]) {
        const state = await stateRepository.findOne(DEFAULT_STATE);

        const bidAddress = await addressRepository.save({
          ...new Address(),
          addressLine1: address.streetAddress(),
          addressLine2: address.secondaryAddress(),
          city: address.city(1),
          state: state || null,
          zip: address.zipCode()
        });

        const bid: Bid = {
          ...new Bid(),
          name: `BID ${idx} from ${company.companyName()}`,
          projectType: random.arrayElement<number>(getEnumIntValues(ProjectType)),
          businessType: random.arrayElement<number>(getEnumIntValues(BusinessType)),
          plansUploaded: PlansUploaded.NO_UPLOAD,
          region: random.arrayElement<number>(getEnumIntValues(Region)),
          created: new Date(),
          modified: new Date(),
          user: { ...new User(), id: user.id },
          estimateData: { ...new EstimateData(), id: estimateData.id },
          address: bidAddress
        };
        // TODO add project-details?

        await bidRepository.save(bid);
      }
    }
  };

  this.generate = async (): Promise<void> => {
    await setupUserBids();
    this.count = await bidRepository.count();
  };
}
